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

    async registration(login: string, password: string, fullName: string, email:string, phone:string, address:string) {

        // check if user exists
        const candidate = await this.userModel.findOne({ login })
        if (candidate) {
            throw new HttpException("User already exists", HttpStatus.INTERNAL_SERVER_ERROR)
        }

        const uniqueEmail = await this.userModel.findOne({email})
        console.log(uniqueEmail)
        if(uniqueEmail?.isActivated) {
            throw new Error(`User with email ${email} already exists`)
        }
        // create user
        const saltOrRounds = 12;
        const hash = await bcrypt.hash(password, saltOrRounds);
        const activationLink = await uuid.v4()
        const user = await this.userModel.create({ login, password: hash, fullName, activationLink, phone, address, email })

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
            user: userDto
        }
    }

    async login(login, password) {
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
        console.log('saved token');
        return {
            ...tokens,
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
            throw new Error('Всьо хуйня міша, давай па новай')
        }
        const userData = await this.tokenService.validateRefreshToken(refreshToken)
        const tokenFromDb = await this.tokenService.findToken(refreshToken)
        console.log(userData);

        console.log(tokenFromDb);

        if (!userData || !tokenFromDb) {
            throw new Error("Unauthorized user");
        }
        const user = await this.userModel.findById(tokenFromDb.user)

        const userDto = new UserDto(user)
        const tokens = this.tokenService.generateToken({ ...userDto })

        await this.tokenService.saveToken(userDto.id, tokens.refreshToken)
        console.log('saved token');
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
        await this.userModel.create({ login: 'peedorasina', password: 'bebra', fullName: 'syn fermera' })
        return ''
    }
    async getUser(id):Promise<User & any> {
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
    async getPage(id,pageSize:number):Promise<User & any> {
        const page = await this.userModel.find().skip(id * pageSize).limit(pageSize)
        return {page}
    }
    async getLenght() {
        const lenght = await this.userModel.count()
        return lenght
    }
    async findUsers(regex:string) {
        const users = await this.userModel.find({fullName:{$regex:regex}})
        return users
    }
}