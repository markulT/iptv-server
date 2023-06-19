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

    async checkPass(email:string, password:string):Promise<boolean> {
        const user = await this.userModel.findOne({email});
        const arePassEqual = await bcrypt.compare(password, user.password);
        return arePassEqual;
    }

    async createMobileTestSub({email}) {
        const user = await this.userModel.findOne({email:email})
        const randomId = uuid.v4()
        const date = Date.now()
        user.mobileSubOrderId = randomId
        user.mobileSubExists = true
        user.mobileDate = date.toString()
        user.mobileSubLevel = 1
        await user.save()
        return 'success'
    }

    async createSub({email, password, tariffPlan, orderId, acqId}) {
        const accountNumber = uuid.v4()
        const status = 1
        let result


        const user = await this.userModel.findOne({email})
        const fullName = user.fullName
        if (!user) {
            throw new Error('User does not exist')
        }
        // const isPassEquals = await bcrypt.compare(password, user.password)
        // if (!isPassEquals) {
        //     throw new Error('Incorrect password')
        // }

        const userExists = await ministraApi.get(`http://a7777.top/stalker_portal/api/v1/users/${email}`)
        const requestStatus = userExists.data.status
        const date = new Date().toLocaleDateString('ru')
        if (requestStatus == "ERROR") {
            // result = await ministraApi.post(`http://a7777.top/stalker_portal/api/v1/users`,{
            //     login:`${login}`,
            //     password:`${password}`,
            //     full_name:`${fullName}`,
            //     account_number:`${accountNumber}`,
            //     tariff_plan:`${tariffPlan}`,
            //     status:`${status}`
            // })
            result = await ministraApi.post(`http://a7777.top/stalker_portal/api/v1/users`, `login=${email}&password=${password}&full_name=${fullName}&account_number=${accountNumber}&tariff_plan=${tariffPlan}&status=${status}`).then(res => res.data)
            user.orderId = orderId
            user.acqId = acqId
            user.tvSubLevel = tariffPlan
            user.ministraDate = date
            await user.save()
        }
        return result
    }

    async createTestSub({email, password, tariffPlan}) {
        const accountNumber = uuid.v4()
        const status = 1
        let result


        const user = await this.userModel.findOne({email})
        const fullName = user.fullName
        if (!user) {
            throw new Error('User does not exist')
        }
        // const isPassEquals = await bcrypt.compare(password, user.password)
        // if (!isPassEquals) {
        //     throw new Error('Incorrect password')
        // }

        const userExists = await ministraApi.get(`http://a7777.top/stalker_portal/api/v1/users/${email}`)
        const requestStatus = userExists.data.status
        const date = new Date().toLocaleDateString('ru')
        if (requestStatus == "ERROR") {
            // result = await ministraApi.post(`http://a7777.top/stalker_portal/api/v1/users`,{
            //     login:`${login}`,
            //     password:`${password}`,
            //     full_name:`${fullName}`,
            //     account_number:`${accountNumber}`,
            //     tariff_plan:`${tariffPlan}`,
            //     status:`${status}`
            // })
            result = await ministraApi.post(`http://a7777.top/stalker_portal/api/v1/users`, `login=${email}&password=${password}&full_name=${fullName}&account_number=${accountNumber}&tariff_plan=${tariffPlan}&status=${status}`).then(res => res.data)
            user.tvSubLevel = tariffPlan
            user.ministraDate = date
            await user.save()
        }
        return result
    }

    async cancelSubscription(email: string, password: string, check = true) {
        const user = await this.userModel.findOne({email})
        const isPassCorrrect = await bcrypt.compare(password, user.password)
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
            await ministraApi.delete(`http://a7777.top/stalker_portal/api/v1/users/${email}`)
            result = json
        })

        user.orderId = ''
        user.tvSubLevel = 0
        user.ministraDate = ''
        await user.save()

        return result
    }

    async createSubMobile({email, password, orderId}) {

        const user = await this.userModel.findOne({email})

        // const arePassEqual = await bcrypt.compare(password, user.password)

        if (!user) {
            throw new HttpException('User does not exist', HttpStatus.NOT_FOUND)
        }

        // if (!arePassEqual) {
        //     throw new HttpException('Incorrect password', HttpStatus.FORBIDDEN)
        // }
        const date = new Date().toLocaleDateString('ru')
        user.mobileSubOrderId = orderId
        user.mobileSubExists = true
        user.mobileDate = date
        user.mobileSubLevel = 1
        await user.save()
        return 'Success'
    }

    async cancelMobileSub({email, password, orderId}, check = true):Promise<cancelResponseType> {
        const user = await this.userModel.findOne({email:email})
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
            throw new HttpException({message: 'Not subbed ?'}, HttpStatus.SERVICE_UNAVAILABLE)
        }
        await this.liqPay.api("request", {
            "action": "unsubscribe",
            "version": "3",
            "order_id": `${orderId}`
        }, async function (json) {
            // await ministraApi.delete(`http://a7777.top/stalker_portal/api/v1/users/${login}`)
            result = json
        })
        user.mobileSubOrderId = ''
        user.mobileSubExists = false
        user.mobileSubLevel = 0
        user.mobileDate = ''
        await user.save()
        return {
            message:'Successfuly canceled message',
            code:200,
            status:'Success'
        }
    }

    async findOrderId(email) {
        const user = await this.userModel.findOne({email:email})
        return user.mobileSubOrderId
    }

    async isUserSubed(email: string, key: subType): Promise<boolean | string> {
        const user = await this.userModel.findOne({email:email})
        if (user[key] !== '') {
            return user[key]
        } else {
            return false
        }
    }

    async getUser(email: string): Promise<User> {
        const user = await this.userModel.findOne({email:email})
        return user
    }
    async findUserByOrderMobile(orderId:string):Promise<User> {
        const user = await this.userModel.findOne({mobileSubOrderId:orderId})
        return user
    }
    async findUserByOrderMinistra(orderId:string):Promise<User> {
        const user = await this.userModel.findOne({orderId:orderId})
        return user
    }



}
