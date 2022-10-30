import {Body, Controller, HttpStatus, Post, Res, Req, HttpException} from "@nestjs/common";
import {MinistraService} from "./ministra.service";
import {Response} from "express";


@Controller('/ministra')
export class MinistraController {
    constructor(
        private ministraService: MinistraService
    ) {
    }

    @Post('/changeMacAddress')
    async changeMacAddress(@Body() body, @Res({passthrough: true}) res: Response, @Req() req) {

        const user = req.user
        console.log('bobr')
        console.log(user.login)
        const login = body.login

        if (user.login != login) {
            throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN)
        }

        const response = await this.ministraService.changeMacAddesss(body, user.login)
        if (response.status == 403) {
            res.status(HttpStatus.FORBIDDEN).send()
        }

        return response
    }
}