import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";
import * as bcrypt from "bcrypt";
import {ministraApi} from "../payments/pay.service";


@Injectable()
export class MinistraService {

    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>
    ) {
    }

    async changeMacAddesss(body, userLogin) {



        const login = userLogin

        const newMacAddress = body.newMac
        console.log(newMacAddress)

        const user = await this.userModel.findOne({ login })
        if (!user) {
            throw new Error('User does not exist')
        }
        console.log('works')
        if(!user.isActivated) {
            return {status:403}
        }

        const userExists = await ministraApi.get(`http://a7777.top/stalker_portal/api/v1/users/${login}`)
        const requestStatus = userExists.data.status
        
        console.log("Adding user to MinistraTV database...")
        if (requestStatus == "ERROR") {
            return {message:'No such user.Buy tariff first', statusCode:404}
        }
        const response = await ministraApi.put(`http://a7777.top/stalker_portal/api/v1/users/${login}`, `stb_mac=${newMacAddress}`).then(res=>res.data)
        return response
    }
}