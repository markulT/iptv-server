import {Body, Controller, HttpStatus, Post, Res} from "@nestjs/common";
import {MinistraService} from "./ministra.service";
import {Response} from "express";



@Controller('/ministra')
export class MinistraController {
    constructor(
        private ministraService: MinistraService
    ) {
    }
    @Post('/changeMacAddress')
    async changeMacAddress(@Body() body, @Res({passthrough:true}) res: Response) {
            const response = await this.ministraService.changeMacAddesss(body)
            if(response.status == 403) {
                res.status(HttpStatus.FORBIDDEN).send()
            }

            return response
    }
}