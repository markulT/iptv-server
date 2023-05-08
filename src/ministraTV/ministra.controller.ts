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
        const email = body.email

        if (user.email != email) {
            throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN)
        }

        const response = await this.ministraService.changeMacAddesss(body, user.email)
        if (response.status == 403) {
            res.status(HttpStatus.FORBIDDEN).send()
        }

        return response
    }
}