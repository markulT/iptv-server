import {Body, Controller, Delete, Get, HttpException, HttpStatus, Post, Req, Res} from "@nestjs/common";
import {PayService} from "./pay.service";
import {Vimeo} from 'vimeo'
import {ConfigService} from "@nestjs/config";
import * as crypto from "crypto";
import Liqpay from "./payy";
import {log} from "util";


@Controller('/payments')
export class PayController {
    private Vimeo = Vimeo
    private client = new Vimeo(`${this.configService.get("VIMEO_CLIENT_ID")}`, `${this.configService.get("VIMEO_CLIENT_SECRET")}`, "b8216b43b2948230ffa814a9d27abc7f")
    private liqPay = new Liqpay(this.configService.get("PUBLIC_KEY_PAY"), this.configService.get("PRIVATE_KEY_PAY"))
    public tariffList = {
        12: 2,
        5: 1,
        15: 3
    }

    constructor(
        private payService: PayService,
        private configService: ConfigService
    ) {
    }

    @Get('/test')
    async test() {
        this.client.request({
            method: "GET",
            path: "/tutorial"
        }, (error, body, statusCode, headers) => {
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
        const login = body.login as string
        const password = body.password as string
        const result = await this.payService.cancelSubscription(login, password)
        return result
    }

    @Post('/callback')
    async payment(@Req() req, @Res() res, @Body() body) {
        const userData = req.user
        let result

        //verifying signature
        const liqPayPrivate = this.configService.get('LIQPAY_PRIVATE')
        const sign = this.liqPay.str_to_sign(liqPayPrivate + body.paymentData.data + liqPayPrivate)
        if (sign != body.paymentData.signature) {
            throw new HttpException('You are not allowed', HttpStatus.FORBIDDEN)
        }
        const paymentData = JSON.parse(atob(body.paymentData.data))

        // cancel previous sub if exists
        const isUserSubed = await this.payService.isUserSubed(userData.login, 'orderId')
        const isUserMobileSubed = await this.payService.isUserSubed(userData.login, 'mobileSubOrderId')
        const user = await this.payService.getUser(userData.login)

        switch (paymentData.action) {
            case 'subscribe':
                if (paymentData.status == 'subscribed') {
                    switch (paymentData.amount) {
                        case 5:
                            if (typeof isUserSubed == 'string') {
                                await this.payService.cancelSubscription(userData.login, user.password, false)
                            }
                            result = await this.payService.createSub({
                                login: userData.login,
                                password: body.password,
                                tariffPlan: 1,
                                orderId: paymentData.order_id,
                                acqId: paymentData.acq_id
                            })

                        case 10:
                            if (typeof isUserSubed == 'string') {
                                await this.payService.cancelSubscription(userData.login, user.password, false)
                            }
                            result = await this.payService.createSub({
                                login: userData.login,
                                password: body.password,
                                tariffPlan: 2,
                                orderId: paymentData.order_id,
                                acqId: paymentData.acq_id
                            })
                        case 15:
                            console.log('6666666666666666666666666666666666')
                            if(typeof isUserMobileSubed == 'string') {
                                await this.payService.cancelMobileSub({login:userData.login, password:user.password,orderId:user.mobileSubOrderId })
                            }
                            result = await this.payService.createSubMobile({
                                login:userData.login,
                                password:body.password,
                                orderId:body.paymentData.order_id
                            })
                    }
                }
                console.log(result)
                return result
            default:
                throw new HttpException('INTERNAL SERVER ERROR', HttpStatus.INTERNAL_SERVER_ERROR)
        }
        return result

        // @Post(`/freeTrial`)
        // async freeTrial(@Body() body) {
        //     const result = await this.payService
        //     return result
        // }
    }
    @Post('/cancelMobileSub')
    async cancelMobileSub(@Req() req, @Req() res, @Body() body) {
        const userData = req.user
        const orderId = await this.payService.findOrderId(userData.login)
        const result = await this.payService.cancelMobileSub({login:userData.login, password:body.password, orderId:orderId})
        return result
    }

}