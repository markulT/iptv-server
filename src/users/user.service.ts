import { UserDto } from './../dtos/user-dto';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './../token/token.service';

import { User, UserDocument } from './user.schema';
import {Get, HttpException, HttpStatus, Inject, Injectable} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'
import * as uuid from 'uuid'
import axios from 'axios';
import {MailService} from "../mail/mail.service";
import {type} from "os";
// import {SocketServerProvider} from "@nestjs/websockets/socket-server-provider";
import {SessionAuth, SessionAuthDocument} from "../socket/sessionAuth.schema";
import {SocketServerProvider} from "@nestjs/websockets/socket-server-provider";
import {SocketGateway} from "../socket/socket.gateway";

type $FixMe = any

export type loginData = {
    accessToken:string,
    refreshToken:string
    user:UserDto,
    fullProfile?:$FixMe
}

export type findUserType = {
    user:User,
    clientMinistra:string
}

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private tokenService: TokenService,
        private configService: ConfigService,
        private mailService: MailService,
        // private socketServerProvider: SocketServerProvider,
        @InjectModel(SessionAuth.name) private readonly sessionAuthModel: Model<SessionAuthDocument>,
        private readonly socketGateway:SocketGateway
    ) { }
    test() {
        return 'Hola comosta'
    }

    async registration(password: string, fullName: string, email:string, phone:string, address:string):Promise<loginData> {

        // check if user exists
        const candidate = await this.userModel.findOne({ email })
        if (candidate) {
            throw new HttpException("User already exists", HttpStatus.INTERNAL_SERVER_ERROR)
        }

        // const uniqueEmail = await this.userModel.findOne({email})
        //
        // if(uniqueEmail?.isActivated) {
        //     throw new Error(`User with email ${email} already exists`)
        // }
        // create user
        const saltOrRounds = 12;
        const hash = await bcrypt.hash(password, saltOrRounds);
        const activationLink = await uuid.v4()
        const date = new Date().toLocaleDateString('ru')
        const user = await this.userModel.create({ password: hash, fullName, activationLink, phone, address, email, signDate:date })

        // create and save jwts
        const userDto = new UserDto(user);

        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${email}`, {
            method: "GET",
            headers: {
                Authorization: 'Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa'
            }
        })


        const jsonUserMinistra = JSON.stringify(userMinistra?.data)
        // await this.mailService.sendActivationEmail(email, activationLink)
        const tokens = this.tokenService.generateToken({ ...userDto })
        await this.tokenService.saveToken(userDto.id, tokens.refreshToken)
        return {
            ...tokens,
            user: userDto
        }
    }

    async login(email, password):Promise<loginData> {
        const user = await this.userModel.findOne({ email })
        if (!user) {
            throw new Error('User does not exist')
        }

        const isPassEquals = await bcrypt.compare(password, user.password)
        if (!isPassEquals) {
            throw new HttpException('Wrong password', HttpStatus.EXPECTATION_FAILED)
        }
        const userDto = new UserDto(user)
        const tokens = this.tokenService.generateToken({ ...userDto })

        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${email}`, {
            method: "GET",
            headers: {
                Authorization: 'Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa'
            }
        })

        const jsonUserMinistra = JSON.stringify(userMinistra?.data)
        await this.tokenService.saveToken(userDto.id, tokens.refreshToken)
        return {
            ...tokens,
            user: userDto,
            fullProfile: jsonUserMinistra
        }
    }

    async logout(refreshToken) {
        try {
            const token = await this.tokenService.removeToken(refreshToken)
            return token
        } catch (error) {
            console.log(error);
        }
    }

    // async activate(link: string) {
    //     try {
    //         const user = await this.userModel.findOne({ activationLink: link })
    //         if (!user) {
    //             throw new Error('Incorrect link')
    //         }
    //         // change activated status
    //         user.isActivated = true
    //         await user.save()
    //         return 0
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new HttpException('No refresh token', HttpStatus.UNAUTHORIZED)
        }
        const userData = await this.tokenService.validateRefreshToken(refreshToken)
        const tokenFromDb = await this.tokenService.findToken(refreshToken)
        console.log(tokenFromDb)
        if (!userData || !tokenFromDb) {

            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
        }


        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const user = await this.userModel.findById(userData.id)

        const userDto = new UserDto(user)
        const tokens = this.tokenService.generateToken({ ...userDto })
        await this.tokenService.saveToken(userDto.id, tokens.refreshToken, refreshToken)
        return {
            ...tokens,
            user: userDto
        }

    }

    async activate(link: string) {
        try {
            const user = await this.userModel.findOne({ activationLink: link })
            if (!user) {
                throw new Error('Incorrect link')
            }
            // change activated status
            user.isActivated = true
            await user.save()
            return "Success"
        } catch (error) {
            console.log(error);
        }
    }

    async getUsers() {
        const users = await this.userModel.find()
        return users
    }

    // async getProfile(login) {

    //     return 0
    // }
    async callBack() {
        await this.userModel.create({ login: '1', password: '2', fullName: '3' })
        return ''
    }
    async getUser(id):Promise<findUserType> {
        const user = await this.userModel.findById(id)
        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${user.email}`, {
            method: "GET",
            headers: {
                Authorization: 'Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa'
            }
        })
        const clientMinistra = JSON.stringify(userMinistra?.data.results)
        return {
            user,
            clientMinistra
        }
    }
    async getPage(id,pageSize:number):Promise<Array<User>> {
        if (id==1) {
            return await this.userModel.find().limit(pageSize)
        }
        const page = await this.userModel.find().skip((id-1) * pageSize).limit(pageSize)
        return page
    }
    async getLenght() {
        const lenght = await this.userModel.count()
        return lenght
    }
    async findUsers(regex:string):Promise<Array<User>> {
        const users = await this.userModel.find({fullName:{$regex:regex}})
        return users
    }
    async getProfile(userData) {
        const user = await this.userModel.findOne({email:userData.email})

        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${user.email}`, {
            method: "GET",
            headers: {
                Authorization: 'Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa'
            }
        })

        const jsonUserMinistra = JSON.stringify(userMinistra?.data)

        return {
            fullProfile:jsonUserMinistra
        }
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
        // console.log(await this.socketServerProvider)
        // const socket = await this.socketServerProvider.scanForSocketServer({cors:{origin:"*"}}, this.configService.get("CURRENT_SERVER_URL")).server.sockets.sockets.get(sessionAuth.sessionId)
        // console.log(socket)
        // if(socket) {
        //     socket.emit('session-closed', {
        //         ...tokens,
        //         user:userDto,
        //         fullProfile: jsonUserMinistra
        //     })
        // }
    }

}
