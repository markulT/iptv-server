import {UserDto} from './../dtos/user-dto';
import {ConfigService} from '@nestjs/config';
import {TokenService} from './../token/token.service';

import {User, UserDocument} from './user.schema';
import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'
import * as uuid from 'uuid'
import axios from 'axios';
import {MailService} from "../mail/mail.service";
// import {SocketServerProvider} from "@nestjs/websockets/socket-server-provider";
import {SessionAuth, SessionAuthDocument} from "../socket/sessionAuth.schema";
import {SocketGateway} from "../socket/socket.gateway";
import {randomUUID} from "crypto";
import {PasswordRenewal, PasswordRenewalDocument} from "./renewalPassword.schema";

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
        @InjectModel(PasswordRenewal.name) private readonly passwordRenewalModel: Model<PasswordRenewalDocument>,
        private readonly socketGateway:SocketGateway
    ) { }
    test() {
        return ''
    }

    async updatePassword(renewalCode:string, newPassword:string):Promise<any> {
        const passwordRenewalItem = await this.passwordRenewalModel.findOne({renewalCode: renewalCode})
        if (passwordRenewalItem == null) {
            throw new HttpException("Invalid renewal code", HttpStatus.EXPECTATION_FAILED)
        }
        const saltOrRounds = 12;
        const hash = await bcrypt.hash(newPassword, saltOrRounds);
        const user = await this.userModel.findById(passwordRenewalItem.userId)
        if (user == null)  {
            throw new HttpException("Invalid renewal code", HttpStatus.EXPECTATION_FAILED)
        }
        await this.userModel.updateOne({email:user.email}, {password: hash})
        await this.passwordRenewalModel.deleteOne({renewalCode: renewalCode})
    }

    //await this.passwordRenewalModel.deleteOne()

    async generateRenewalLink(email: string):Promise<string> {
        const user = await this.userModel.findOne({email:email})
        const renewalCode = randomUUID()
        const scheduledDate = new Date()
        scheduledDate.setHours(scheduledDate.getHours() + 1)
        const passwordRenewalItem = this.passwordRenewalModel.create({
            email:user.email,
            userId: user.id,
            expireDate: scheduledDate,
            renewalCode: renewalCode
        })

        return renewalCode
    }

    async registration(password: string, fullName: string, email:string, phone:string, address:string, dealer:string):Promise<loginData> {

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
        const date = new Date()
        const trialExpirationDate = new Date(date);
        trialExpirationDate.setDate(trialExpirationDate.getDate() + 14);
        const user = await this.userModel.create(
            { password: hash,
            fullName, activationLink,
            phone,
            address,
            email,
            signDate:date,
            ministraDate:date,
            subLevel: 4,
            tvSubLevel: 4,
            mobileSubLevel: 4,
            freeTrialUsed: false,
            mobileSubOrderId: "TRIAL",
            mobileSubExists:true,
            orderId: "TRIAL",
            trialExpirationDate: trialExpirationDate,
            dealer:dealer}
        )

        // create and save jwts
        const userDto = new UserDto(user);

        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${email}`, {
            method: "GET",
            headers: {
                Authorization: 'Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa'
            }
        })


        const jsonUserMinistra = JSON.stringify(userMinistra?.data)
        await this.mailService.sendActivationEmail(email, activationLink)
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
            throw new HttpException('User does not exist', HttpStatus.EXPECTATION_FAILED)
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
            user: user
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

    async getUsers(filters: Record<string, any> = {}) {
        const users = await this.userModel.find(filters)
        return users
    }

    async getUsersCount(filters: Record<string, any> = {}) {
        return this.userModel.count(filters);
    }

    async getUsersBy(param) {
        const users = await this.userModel.find(param)
        return users
    }

    async getUsersCountBy(param) {
        const users = await this.userModel.count(param)
        return users
    }

    async getCountsForMultipleParams(paramsArray) {
        const data = [];

        for (const param of paramsArray) {
            const count = await this.getUsersCountBy(param);
            data.push(count);
        }

        return data;
    }

    async getGainCountBy(paramsArray) {
        const data = [];

        for (const param of paramsArray) {
            const count = await this.getUsersCountBy(param);
            data.push(count);
        }

        return data;
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
        console.log(user)
        return {
            user,
            clientMinistra
        }
    }
    async getPage(id,pageSize:number, filters: Record<string, any> = {}):Promise<Array<User>> {
        if (id==1) {
            return this.userModel.find(filters).limit(pageSize);
        }
        return this.userModel.find(filters).skip((id - 1) * pageSize).limit(pageSize);
    }

    async getPageBy(id, pageSize:number, filters: Record<string, any> = {}) {

        if (id === 1) {
            return this.userModel.find(filters).limit(pageSize);
        }

        const page = await this.userModel
            .find(filters)
            .skip((id - 1) * pageSize)
            .limit(pageSize);
        return page;
    }

    async getPagesLength(filters: Record<string, any> = {}) {
        const page = await this.userModel.find(filters)

        return page.length;
    }

    async getLength() {
        return await this.userModel.count();
    }

    async findUsers(regex: string, dealer: string): Promise<Array<User>> {
        const lowercaseRegex = regex.toLowerCase();
        const query: any = {
            $or: [
                { fullName: { $regex: lowercaseRegex, $options: 'i' } },
                { email: { $regex: lowercaseRegex, $options: 'i' } },
                { phone: { $regex: lowercaseRegex, $options: 'i' } },
            ],
        };

        if (dealer) {
            query.dealer = dealer;
        }

        return this.userModel.find(query);
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
            fullProfile:user
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

    async getUserDto(email:string):Promise<UserDto> {
        const user = await this.userModel.findOne({email:email})
        return new UserDto(user);
    }

}
