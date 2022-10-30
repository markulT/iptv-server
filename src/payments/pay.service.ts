import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

import * as uuid from 'uuid'
import Liqpay from './payy'
import axios, {Axios} from 'axios'
import {TokenService} from "../token/token.service";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";
import * as bcrypt from 'bcrypt'
import {stat} from "fs";
// import Liqpay from './liqpay'

// const liqpay = new Liqpay(process.env.PUBLIC_KEY_PAY, process.env.PRIVATE_KEY_PAY)

export const ministraApi = axios.create({
    baseURL: '',
    headers: {
        "Authorization": "Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa",
        "Content-Type": "text/plain"
    }
})

type subType = 'orderId' | 'mobileSubOrderId'

export interface cancelResponseType {
    message:string,
    code:number,
    status:string
}

@Injectable()
export class PayService {

    private liqPay = new Liqpay(this.configService.get("PUBLIC_KEY_PAY"), this.configService.get("PRIVATE_KEY_PAY"))

    constructor(
        private configService: ConfigService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {

    }

    test() {
        return 'test'
    }


    async createSub({login, password, tariffPlan, orderId, acqId}) {
        const accountNumber = uuid.v4()
        const status = 1
        let result


        const user = await this.userModel.findOne({login})
        const fullName = user.fullName
        if (!user) {
            throw new Error('User does not exist')
        }
        console.log('Checking passwords')
        const isPassEquals = await bcrypt.compare(password, user.password)
        if (!isPassEquals) {
            throw new Error('Incorrect password')
        }
        console.log('Курва тарифний план')
        console.log(tariffPlan)

        const userExists = await ministraApi.get(`http://a7777.top/stalker_portal/api/v1/users/${login}`)
        const requestStatus = userExists.data.status

        console.log("Adding user to MinistraTV database...")
        if (requestStatus == "ERROR") {
            // result = await ministraApi.post(`http://a7777.top/stalker_portal/api/v1/users`,{
            //     login:`${login}`,
            //     password:`${password}`,
            //     full_name:`${fullName}`,
            //     account_number:`${accountNumber}`,
            //     tariff_plan:`${tariffPlan}`,
            //     status:`${status}`
            // })
            result = await ministraApi.post(`http://a7777.top/stalker_portal/api/v1/users`, `login=${login}&password=${password}&full_name=${fullName}&account_number=${accountNumber}&tariff_plan=${tariffPlan}&status=${status}`).then(res => res.data)
            user.orderId = orderId
            user.acqId = acqId
            user.tvSubLevel = tariffPlan
            await user.save()
        }
        return result
    }

    async cancelSubscription(login: string, password: string, check = true) {
        const user = await this.userModel.findOne({login: login})
        const isPassCorrrect = await bcrypt.compare(password, user.password)
        console.log(password, user.password, 'canceling sub')
        if (check) {
            if (!isPassCorrrect) {
                throw new Error("Wrong password")
                return {
                    status: "Error",
                    message: "Wrong password"
                }
            }
        }

        const orderId = user.orderId
        let result;

        await this.liqPay.api("request", {
            "action": "unsubscribe",
            "version": "3",
            "order_id": `${orderId}`
        }, async function (json) {
            console.log(json.status)
            await ministraApi.delete(`http://a7777.top/stalker_portal/api/v1/users/${login}`)
            result = json
        })

        user.orderId = ''
        user.tvSubLevel = 0
        await user.save()

        return result
    }

    async createSubMobile({login, password, orderId}) {
        console.log('nigga niggga!&*@@$($SYUAIHDJAIKHGFHAJKSFG!*&^#*&!@T$G*@6873687453127645762')
        const user = await this.userModel.findOne({login})

        const arePassEqual = await bcrypt.compare(password, user.password)
        console.log(login, password, orderId, 'якась параша')
        if (!user) {
            throw new HttpException('User does not exist', HttpStatus.NOT_FOUND)
        }

        if (!arePassEqual) {
            throw new HttpException('Incorrect password', HttpStatus.FORBIDDEN)
        }

        user.mobileSubOrderId = orderId
        user.mobileSubExists = true
        await user.save()
        return 'Success'
    }

    async cancelMobileSub({login, password, orderId}, check = true):Promise<cancelResponseType> {
        const user = await this.userModel.findOne({login: login})
        const arePassEqual = await bcrypt.compare(password, user.password)
        let result

        if (!user) {
            throw new HttpException('User does not exist', HttpStatus.NOT_FOUND)
        }
        if(check) {
            if (!arePassEqual) {
                throw new HttpException('Incorrect password', HttpStatus.FORBIDDEN)
            }
        }

        if (!user.mobileSubOrderId) {
            throw new HttpException({message: 'В тебе взагалі нема підписки, типу що ти в біса очікував отримати ?'}, HttpStatus.SERVICE_UNAVAILABLE)
        }
        user.mobileSubOrderId = ''
        user.mobileSubExists = false
        user.mobileSubLevel = 0
        await this.liqPay.api("request", {
            "action": "unsubscribe",
            "version": "3",
            "order_id": `${orderId}`
        }, async function (json) {
            console.log(json.status)
            // await ministraApi.delete(`http://a7777.top/stalker_portal/api/v1/users/${login}`)
            result = json
        })

        await user.save()
        return {
            message:'Successfuly canceled message',
            code:200,
            status:'Success'
        }
    }

    async findOrderId(login) {
        const user = await this.userModel.findOne({login: login})
        return user.mobileSubOrderId
    }

    async isUserSubed(login: string, key: subType): Promise<boolean | string> {
        const user = await this.userModel.findOne({login: login})
        if (user[key] !== '') {
            return user[key]
        } else {
            return false
        }
    }

    async getUser(login: string): Promise<User> {
        const user = await this.userModel.findOne({login: login})
        return user
    }
}