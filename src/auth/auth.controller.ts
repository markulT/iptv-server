import {Body, Controller, Post, Req} from "@nestjs/common";
import {AuthService} from "./auth.service";


@Controller("/auth")
export class AuthController {

    constructor(
        private authService:AuthService
    ) {
    }

    @Post('/submitTvAuth')
    async submitTvAuth(@Req() req, @Body() body) {
        const userData = req.user
        const authCode = body.authCode
        console.log(userData)
        this.authService.submitTvAuthCode(authCode, userData.email)
        return null
    }
}