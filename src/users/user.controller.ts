import {ConfigService} from '@nestjs/config';
import {createUserDto} from './../dtos/create-user.dto';
import {loginData, UserService} from './user.service';
import {Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put, Req, Request, Res} from "@nestjs/common";
import ApiError from '../exceptions/api-error'
import {MailService} from "../mail/mail.service";
import {isNil} from "@nestjs/common/utils/shared.utils";
import {Response} from "express";
import {constants} from "http2";

interface responseAuth {
    userData:loginData
}

class RequestNewPasswordRequestDTO {
    readonly email:string;
}

class UpdatePasswordDTO {
    readonly newPassword:string;
    readonly renewalCode:string;
}

@Controller('/api')
export class UserController {
    constructor(
        private userService: UserService,
        private configService: ConfigService,
        private mailService: MailService
    ) { }
    @Get()
    test() {
        return this.userService.test()
    }
    @Post('/registration')
    async registration(@Body() createUserDto: createUserDto, @Res({ passthrough: true }) response):Promise<responseAuth> {
        try {
            // getting user data
            const password = createUserDto.password.trim()
            const fullName = createUserDto.fullName
            const email = createUserDto.email.trim()
            const phone = createUserDto.phone
            const address = createUserDto.address
            const dealer = createUserDto.dealer != null || createUserDto.dealer != "" ? createUserDto.dealer : ""
            console.log("dealer :" + createUserDto.dealer)
            const userData = await this.userService.registration(password, fullName, email, phone, address, dealer)
            response.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite:'none', secure:true })
            return {
                userData
            }

        } catch (error) {
            if (error instanceof ApiError) {
                response.status(401).send('Unauthorized user')
            }
        }

    }
    @Post('/login')
    async login(@Body() createUserDto: createUserDto, @Res({ passthrough: true }) res):Promise<responseAuth> {


        // getting request`s body data
        const email = createUserDto.email.trim()
        const password = createUserDto.password.trim()
        const userData = await this.userService.login(email, password)
        res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite:'none', secure:true })
        // res.setHeader('Set-Cookie', `refreshToken=${userData.refreshToken}; HttpOnly; SameSite=None ; Secure ; Max-Age=${30 * 24 * 60 * 60 * 1000}; Path=/`)

        return {
            userData
        }

    }
    @Post('/logout')
    async logout(@Req() req: Request, @Res({passthrough:true}) res) {

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { refreshToken } = req.cookies
        const token = await this.userService.logout(refreshToken)
        res.clearCookie('refreshToken')
        return { token }
    }

    @Get('/refresh')
    async refresh(@Req() req, @Res({passthrough:true}) res) {

        const { refreshToken } = req.cookies

        const userData = await this.userService.refresh(refreshToken)

        res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite:'none', secure:true })

        return {
            userData
        }
    }

    @Get('/users')
    async getUsers(@Req() req) {
        try {
            const users = await this.userService.getUsers()
            return users
        } catch (e) {

        }
    }

    @Get('/activate/:link')
    async activate(@Param('link') link: string, @Res() res) {
        try {
            await this.userService.activate(link)
            return res.status(200).redirect(this.configService.get('REDIRECT_LINK'))
        } catch (error) {
            console.log(error);
        }
    }

    // @Get('/profile')
    // async getProfile(@Req() req) {
    //     try {

    //     } catch (e) {
    //         console.log(e);
    //     }
    // }
    @Post('/callback')
    async subscription(@Body() body) {
        await this.userService.callBack()
        return ''
    }
    @Get('/getFullProfile')
    async getFullProfile(@Req() req) {
        const userData = req.user
        const fullProfile = await this.userService.getProfile(userData)
        return {
            fullProfile
        }
    }

    @Post('/submitTvAuth')
    async submitTvAuth(@Req() req, @Body() body) {
        const userData = req.user
        const authCode = body.authCode
        this.userService.submitTvAuthCode(authCode, userData.email)
        return null
    }

    @Get("/profile")
    async profile(@Req() req) {
        const userData = req.user
        return await this.userService.getUserDto(userData.email)
    }

    @Put("/forgotPassword")
    async requestNewPassword(@Req() req, @Body() body: RequestNewPasswordRequestDTO) {
        const renewalCode = await this.userService.generateRenewalLink(body.email)
        await this.mailService.sendPasswordRenewalLink(body.email, renewalCode)
        return null
    }

    @Put("/updatePassword")
    async updatePassword(@Req() req, @Body() body:UpdatePasswordDTO, @Res() res:Response) {
        try{
            await this.userService.updatePassword(body.renewalCode, body.newPassword)
            res.status(HttpStatus.OK).send({message:"Password successfully updated"})
            return null
        } catch (e) {
            if (e.getStatus() != undefined || e.getStatus() != null) {
                res.status(e.getStatus()).send({message:"Some error occured while updating password : " + e.getResponse()})
            } else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message:"Error : " + e.message})
            }
        }
    }

}

