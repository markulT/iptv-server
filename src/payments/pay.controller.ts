import {Body, Controller, Delete, Get, HttpException, HttpStatus, Post, Req, Res} from "@nestjs/common";
import {ministraApi, PayService} from "./pay.service";
import {Vimeo} from 'vimeo'
import {ConfigService} from "@nestjs/config";
import * as crypto from "crypto";
import Liqpay from "./payy";
import {log} from "util";
import * as http from "http";



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
        const result = await this.payService.createSub(body)
        return result
    }

    @Post('/createTestSub')
    async createTestSub(@Body() body) {
        const result = await this.payService.createTestSub(body)
        return result
    }

    @Get("/createMobileTestSub")
    async createMobileTestSub(@Req() req) {
        const user = req.user
        await this.payService.createMobileTestSub({email:user.email})
        return
    }


    @Post('/cancelSub')
    async cancelSub(@Body() body) {
        const email = body.email as string
        const password = body.password as string
        const result = await this.payService.cancelSubscription(email, password)
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
        const isUserSubed = await this.payService.isUserSubed(userData.email, 'orderId')
        const isUserMobileSubed = await this.payService.isUserSubed(userData.email, 'mobileSubOrderId')
        const user = await this.payService.getUser(userData.email)
        const date = new Date().toLocaleDateString('ru')
        switch (paymentData.action) {
            case 'subscribe':
                if (paymentData.status == 'subscribed') {
                    switch (paymentData.amount) {
                        case 1:
                            if (typeof isUserSubed == 'string') {
                                await this.payService.cancelSubscription(userData.email, user.password, false)
                            }
                            if (typeof isUserMobileSubed == 'string') {
                                await this.payService.cancelMobileSub({
                                    email: userData.email,
                                    password: user.password,
                                    orderId: user.mobileSubOrderId
                                })
                            }

                            result = await this.payService.createSub({
                                email: userData.email,
                                password: body.password,
                                tariffPlan: 1,
                                orderId: paymentData.order_id,
                                acqId: paymentData.acq_id,
                            })
                            await this.payService.createSubMobile({
                                email: userData.email,
                                password: body.password,
                                orderId: body.paymentData.order_id
                            })
                        case 5:
                            if (typeof isUserSubed == 'string') {
                                await this.payService.cancelSubscription(userData.email, user.password, false)
                            }
                            if (typeof isUserMobileSubed == 'string') {
                                await this.payService.cancelMobileSub({
                                    email: userData.email,
                                    password: user.password,
                                    orderId: user.mobileSubOrderId
                                })
                            }
                            result = await this.payService.createSub({
                                email: userData.email,
                                password: body.password,
                                tariffPlan: 1,
                                orderId: paymentData.order_id,
                                acqId: paymentData.acq_id,
                            })
                            await this.payService.createSubMobile({
                                email: userData.email,
                                password: body.password,
                                orderId: body.paymentData.order_id
                            })
                        case 10:
                            if (typeof isUserSubed == 'string') {
                                await this.payService.cancelSubscription(userData.email, user.password, false)
                            }
                            if (typeof isUserMobileSubed == 'string') {
                                await this.payService.cancelMobileSub({
                                    email: userData.email,
                                    password: user.password,
                                    orderId: user.mobileSubOrderId
                                })
                            }
                            result = await this.payService.createSub({
                                email: userData.email,
                                password: body.password,
                                tariffPlan: 2,
                                orderId: paymentData.order_id,
                                acqId: paymentData.acq_id,
                            })
                            await this.payService.createSubMobile({
                                email: userData.email,
                                password: body.password,
                                orderId: body.paymentData.order_id
                            })
                        case 15:
                            if (typeof isUserMobileSubed == 'string') {
                                await this.payService.cancelMobileSub({
                                    email: userData.email,
                                    password: user.password,
                                    orderId: user.mobileSubOrderId
                                })
                            }
                            result = await this.payService.createSubMobile({
                                email: userData.email,
                                password: body.password,
                                orderId: body.paymentData.order_id
                            })
                    }
                }

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

    @Post("/checkPass")
    async checkPass(@Req() req, @Res() res, @Body() body) {
        const userData = req.user;
        const isPassCorrect = await this.payService.checkPass(userData.email, body.password);
        if (!isPassCorrect) {
            throw new HttpException("Wrong password", HttpStatus.EXPECTATION_FAILED)
        }
        res.send(isPassCorrect);
    }

    @Post('/cancelMobileSub')
    async cancelMobileSub(@Req() req, @Req() res, @Body() body) {
        const userData = req.user
        const orderId = await this.payService.findOrderId(userData.email)
        const result = await this.payService.cancelMobileSub({
            email: userData.email,
            password: body.password,
            orderId: orderId
        })
        return result
    }

    @Get('/schedule')
    async getSchedule(@Req() req, @Res() res) {
        const userData = req.user
        const isSub = await this.payService.isUserSubed(userData.email, 'orderId')
        if(!isSub) {
            throw new HttpException("User is not subbed", HttpStatus.FORBIDDEN);
        }
        res.sendFile('src/assets/1.jpg')
    }

    @Post('/errorCallback')
    async errorCallback(@Body() body, @Req() req) {
        const liqPayPrivate = this.configService.get('LIQPAY_PRIVATE')
        const sign = this.liqPay.str_to_sign(liqPayPrivate + body.data + liqPayPrivate)
        if (sign !== body.signature) {
            throw new HttpException('Not allowed. Wrong signature', HttpStatus.FORBIDDEN)
        }
        const jsonData = atob(body.data)
        const data = JSON.parse(jsonData)
        console.log(data)
        if (data.action == 'subscribe' && data.status == 'unsubscribed') {
            console.log('works')
            if (data.amount == 15) {
                const user = await this.payService.findUserByOrderMobile(data.order_id)
                console.log(user)
                user.mobileSubExists = false
                user.mobileSubOrderId = ''
                user.mobileSubLevel = 0
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await user.save()
            } else {
                const user = await this.payService.findUserByOrderMinistra(data.order_id)
                await ministraApi.delete(`http://a7777.top/stalker_portal/api/v1/users/${user.email}`)
                user.orderId = ''
                user.tvSubLevel = 0
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await user.save()
            }
        }
    }


}
