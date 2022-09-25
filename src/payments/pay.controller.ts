import {Body, Controller, Get, Post} from "@nestjs/common";
import {PayService} from "./pay.service";
import {Vimeo} from 'vimeo'
import {ConfigService} from "@nestjs/config";


@Controller('/payments')
export class PayController {
    private Vimeo = Vimeo
    private client = new Vimeo(`${this.configService.get("VIMEO_CLIENT_ID")}`,`${this.configService.get("VIMEO_CLIENT_SECRET")}`, "b8216b43b2948230ffa814a9d27abc7f")
    constructor(
        private payService: PayService,
        private configService: ConfigService
    ) {
    }

    @Get('/test')
    async test() {
        this.client.request({
            method:"GET",
            path:"/tutorial"
        },(error, body,statusCode,headers)=>{
            error && console.log(error)
            console.log(body)
        })
        return this.payService.test()
    }

    @Post('/createSub')
    async createSub(@Body() body) {
        console.log('Creating sub')
        const result = await this.payService.createSub(body)
        return result
    }
    @Post('/cancelSub')
    async cancelSub(@Body() body) {
        const result = await this.payService.cancelSubscription(body)
        return result
    }
    @Post('/createSubMobile')
    async createSubMobile() {

        return
    }
    // @Post(`/freeTrial`)
    // async freeTrial(@Body() body) {
    //     const result = await this.payService
    //     return result
    // }
}