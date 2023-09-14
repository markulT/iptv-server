import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";
import {Admin, AdminDocument} from "../admin/admin.schema";
import {TokenService} from "../token/token.service";
import {UserService} from "../users/user.service";
import {MailService} from "../mail/mail.service";
import {PayService} from "../payments/pay.service";
type ErrorResponse = {
    status:number,
    message:string
}
type SuccessResponse = {
    accessToken:string,
    refreshToken:string,
}

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Admin.name) private readonly adminModel:Model<AdminDocument>,
    ) {
    }

    test():string {
        return 'works'
    }

    // async getAdmin(email) {
    //     return await this.adminModel.findOne({email})
    // }
}