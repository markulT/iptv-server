import { UserDto } from './../dtos/user-dto';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './../token/token.service';

import { User, UserDocument } from './user.schema';
import {Get, HttpException, HttpStatus, Injectable} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'
import * as uuid from 'uuid'
import axios from 'axios';
import {MailService} from "../mail/mail.service";
import {type} from "os";

type $FixMe = any

export type loginData = {
    accessToken:string,
    refreshToken:string
    user:typeof UserDto,
    fullProfile:$FixMe
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
        private mailService: MailService
    ) { }
    test() {
        return 'Hola comosta'
    }

    async registration(login: string, password: string, fullName: string, email:string, phone:string, address:string):Promise<loginData> {

        // check if user exists
        const candidate = await this.userModel.findOne({ login })
        if (candidate) {
            throw new HttpException("User already exists", HttpStatus.INTERNAL_SERVER_ERROR)
        }

        const uniqueEmail = await this.userModel.findOne({email})

        if(uniqueEmail?.isActivated) {
            throw new Error(`User with email ${email} already exists`)
        }
        // create user
        const saltOrRounds = 12;
        const hash = await bcrypt.hash(password, saltOrRounds);
        const activationLink = await uuid.v4()
        const date = new Date().toLocaleDateString('ru')
        const user = await this.userModel.create({ login, password: hash, fullName, activationLink, phone, address, email, signDate:date })

        // create and save jwts
        const userDto = new UserDto(user);

        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${login}`, {
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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            user: userDto
        }
    }

    async login(login, password):Promise<loginData> {
        const user = await this.userModel.findOne({ login })
        if (!user) {
            throw new Error('User does not exist')
        }
        const isPassEquals = await bcrypt.compare(password, user.password)
        if (!isPassEquals) {
            throw new Error('Incorrect password')
        }
        const userDto = new UserDto(user)
        const tokens = this.tokenService.generateToken({ ...userDto })

        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${login}`, {
            method: "GET",
            headers: {
                Authorization: 'Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa'
            }
        })

        const jsonUserMinistra = JSON.stringify(userMinistra?.data)

        await this.tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {
            ...tokens,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            user: userDto,
            fullProfile: jsonUserMinistra
        }
    }

    async logout(request) {
        try {
            const { refreshToken } = request.cookies
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

        if (!userData || !tokenFromDb) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
        }


        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const user = await this.userModel.findById(userData.id)

        const userDto = new UserDto(user)
        const tokens = this.tokenService.generateToken({ ...userDto })


        await this.tokenService.saveToken(userDto.id, tokens.refreshToken)
        console.log(userDto)
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
        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${user.login}`, {
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
        console.log(`pageId is ${id}`)
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
        const user = await this.userModel.findOne({login:userData.login})

        const userMinistra = await axios.get(`http://a7777.top/stalker_portal/api/v1/users/${user.login}`, {
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
}
