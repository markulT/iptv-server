import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";

@Injectable()
export class DailySubCheckService {
    @InjectModel(User.name) private userModel: Model<UserDocument>;
    private readonly logger = new Logger(DailySubCheckService.name);

    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async handleCron() {
        const today = new Date()
        const expirationDate = new Date()
        expirationDate.setTime(today.getTime())
        const users = await this.userModel.find({trialExpirationDate: {$lt: today},subLevel: 4, orderId: "TRIAL"})
        console.log("checking subscriptions")
        for (const user of users) {
            user.orderId = ""
            user.subLevel = 0
            user.mobileSubLevel = 0
            user.tvSubLevel = 0
            user.mobileSubOrderId = ""
            user.mobileSubExists = false
            user.mobileDate = null
            user.ministraDate = null
            user.freeTrialUsed = true
            await user.save()
            console.log(user.email); // Example: Print user information
        }
        this.logger.debug('Called when the current second is 10');
    }
}