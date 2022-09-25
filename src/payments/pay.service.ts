import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

import * as uuid from 'uuid'
import Liqpay from './payy'
import axios, {Axios} from 'axios'
import {TokenService} from "../token/token.service";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";
import * as bcrypt from "bcrypt";
import {stat} from "fs";
// import Liqpay from './liqpay'

// const liqpay = new Liqpay(process.env.PUBLIC_KEY_PAY, process.env.PRIVATE_KEY_PAY)

export const ministraApi = axios.create({
    baseURL:'',
    headers:{
        "Authorization":"Basic c3RhbGtlcjpKeGhmZ3ZiamU1OTRLU0pER0pETUtGR2ozOVpa",
        "Content-Type":"text/plain"
    }
})

@Injectable()
export class PayService {

    private liqPay = new Liqpay(this.configService.get("PUBLIC_KEY_PAY"), this.configService.get("PRIVATE_KEY_PAY"))

    constructor(
        private configService:ConfigService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {

    }

    test() {
        return 'test'
    }

    async createSub(body) {

        // MinistraTV user params
        const login = body.login
        const password = body.password
        const accountNumber = uuid.v4()
        const status = 1
        const tariffPlan = body.tariff
        const orderId = body.orderId
        const acqId = body.acqId
        let result

        const user = await this.userModel.findOne({ login })
        const fullName = user.fullName
        if (!user) {
            throw new Error('User does not exist')
        }
        console.log('Checking passwords')
        const isPassEquals = await bcrypt.compare(password, user.password)
        if (!isPassEquals) {
            throw new Error('Incorrect password')
        }

        user.orderId=orderId
        user.acqId = acqId
        await user.save()
        const userExists = await ministraApi.get(`http://a7777.top/stalker_portal/api/v1/users/${login}`)
        console.log("Checking user existing...")
        const requestStatus = userExists.data.status
        console.log(requestStatus)
        console.log(userExists.data)

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
            result = await ministraApi.post(`http://a7777.top/stalker_portal/api/v1/users`, `login=${login}&password=${password}&full_name=${fullName}&account_number=${accountNumber}&tariff_plan=${tariffPlan}&status=${status}`).then(res=>res.data)
        }

        // await this.liqPay.api("request",{
        //         //     "action"   : "unsubscribe",
        //         //     "version"  : "3",
        //         //     "order_id" : "W7PRZKFQ1660383657723645"
        //         // },function(json){
        //         //     console.log('pezda')
        //         //     console.log(json.status)
        //         // })


        return result
    }

    async cancelSubscription(body) {

        const login = body.login
        const password = body.password
        const user = await this.userModel.findOne({login:login})

        const isPassCorrrect = await bcrypt.compare(password, user.password)

        if(!isPassCorrrect) {
            throw new Error("Wrong password")
            return {
                status:"Error",
                message:"Wrong password"
            }
        }

        const orderId = user.orderId
        let result;
        console.log(orderId)

        await this.liqPay.api("request",{
            "action"   : "unsubscribe",
            "version"  : "3",
            "order_id" : `${orderId}`
        }, async function(json){
            console.log(json.status)
            await ministraApi.delete(`http://a7777.top/stalker_portal/api/v1/users/${login}`)
            result = json
        })

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        user.orderId = orderId
        await user.save()

        return result
    }

    async createSubMobile(name:string,email:string,plan:string) {
        const products = 'all'
        //create sub
        return 0
    }

}