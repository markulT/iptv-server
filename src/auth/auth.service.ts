import {forwardRef, Inject, Injectable} from "@nestjs/common";
import axios from "axios";
import {UserDto} from "../dtos/user-dto";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";
import {JwtService} from "@nestjs/jwt";
import {TokenService} from "../token/token.service";
import {ConfigService} from "@nestjs/config";
import {SessionAuth, SessionAuthDocument} from "../socket/sessionAuth.schema";
import {SocketGateway} from "../socket/socket.gateway";
import * as uuid from 'uuid'
import {Cron, Interval} from "@nestjs/schedule";

@Injectable()
export class AuthService {

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private tokenService: TokenService,
        private configService: ConfigService,
        @InjectModel(SessionAuth.name) private readonly sessionAuthModel: Model<SessionAuthDocument>,
        // private readonly socketGateway:SocketGateway
        @Inject(forwardRef(()=>SocketGateway))
        private socketGateway:SocketGateway
    ) {
    }

    async generateTvAuthCode(
        socketId:string
    ):Promise<string> {
        const randomAuthCode = uuid.v4()
        await this.sessionAuthModel.create({authCode: randomAuthCode, sessionId: socketId})
        return randomAuthCode;
    }

    async submitTvAuthCode(
        randomAuthCode:string,
        email:string
    ) {
        const user = await this.userModel.findOne({email:email})
        const sessionAuth = await this.sessionAuthModel.findOne({authCode:randomAuthCode})

        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${email}`, {
            method: "GET",
            headers: {
                Authorization: 'Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa'
            }
        })

        const jsonUserMinistra = JSON.stringify(userMinistra?.data)

        const userDto = new UserDto(user)

        const tokens = this.tokenService.generateToken({ ...userDto })
        await this.tokenService.saveToken(userDto.id, tokens.refreshToken)
        this.socketGateway.sendAuthDetails(sessionAuth.sessionId,{
            ...tokens,
            user:userDto,
            fullProfile:jsonUserMinistra
        })
    }

    @Cron('0 5 * * *')
    async intervalClearSessions() {
        console.log('running scheduled')
        await this.sessionAuthModel.deleteMany({})
    }

}