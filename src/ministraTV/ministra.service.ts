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
        const email = userLogin

        const newMacAddress = body.newMac

        const user = await this.userModel.findOne({ email })
        if (!user) {
            throw new Error('User does not exist')
        }
        if(!user.isActivated) {
            return {status:403}
        }

        const userExists = await ministraApi.get(`http://a7777.top/stalker_portal/api/v1/users/${email}`)
        const requestStatus = userExists.data.status

        if (requestStatus == "ERROR") {
            return {message:'No such user.Buy tariff first', statusCode:404}
        }
        const response = await ministraApi.put(`http://a7777.top/stalker_portal/api/v1/users/${email}`, `stb_mac=${newMacAddress}`).then(res=>res.data)
        return response
    }
}