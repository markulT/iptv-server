import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put, Query,
    Req,
    Res
} from "@nestjs/common";
import {Action, CaslAbilityFactory} from "../casl/casl-ability.factory";
import {UserService} from "../users/user.service";
import {PayService} from "../payments/pay.service";
import {MailService} from "../mail/mail.service";
import {AnalyticsService} from "./analytics.service";


@Controller('/analytics')
export class AnalyticsController {
    constructor(
        private abilityFactory: CaslAbilityFactory,
        private userService: UserService,
        private payService: PayService,
        private mailService: MailService,
        private analyticsService: AnalyticsService,
    ) {
    }
    @Get("/test")
    test():string {
        return this.analyticsService.test()
    }

    @Get('/getChartBy')
    async getChartBy(@Req() req, @Query() query) {
        const activated = query.activated;
        const subscription = query.subscription;
        const signDate = query.signDate;
        const ministraDate = query.ministraDate;
        const adminAuth = req.user
        //const admin = await this.analyticsService.getAdmin(adminAuth.email)
        // const ability = this.abilityFactory.defineAbility(admin)
        // if(!ability.can(Action.Read, User)) {
        //     throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        // }


        if (subscription !== undefined) {
            const count = await this.userService.getCountsForMultipleParams([{ subLevel: 0 }, { subLevel: 1 }, { subLevel: 2 }, { subLevel: 3 }])
            return {
                count
            }
        } else {

        }
        if (signDate !== undefined) {
            const dateParams = [];

            for (let i = 1; i <= 12; i++) {

                const paddedMonth = i < 10 ? `0${i}` : `${i}`;
                const ministraDateParam = { signDate: { $regex: new RegExp(`${paddedMonth}.${2023}$`) } };
                dateParams.push(ministraDateParam);
            }

            const count = await this.userService.getCountsForMultipleParams(dateParams)


            return {
                count
            }
        } else {

        }

        if (ministraDate !== undefined) {
            const dateParams = [];

            for (let i = 1; i <= 12; i++) {

                const paddedMonth = i < 10 ? `0${i}` : `${i}`;
                const ministraDateParam = { ministraDate: { $regex: new RegExp(`${paddedMonth}.${2023}$`) } };
                dateParams.push(ministraDateParam);
            }

            const count = await this.userService.getCountsForMultipleParams(dateParams)


            return {
                count
            }
        } else {

        }

        if (activated !== undefined) {
            const count = await this.userService.getCountsForMultipleParams([{ isActivated: true }, { isActivated: false }])
            return {
                count
            }
        } else {
        }

    }

    @Get('/getGainBy')
    async getGainBy(@Req() req, @Query() query) {
        const newUsersLastMonth = query.newUsersLastMonth;
        const newSubsLastMonth = query.newSubsLastMonth;
        const newPremiumLastMonth = query.newPremiumLastMonth;
        const adminAuth = req.user
        //const admin = await this.analyticsService.getAdmin(adminAuth.email)
        // const ability = this.abilityFactory.defineAbility(admin)
        // if(!ability.can(Action.Read, User)) {
        //     throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        // }

        if (newUsersLastMonth !== undefined) {
            const currentDate = new Date();

            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1; // Note: Months are zero-based, so add 1

            console.log(currentYear + "" + currentMonth);

            const paddedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

            const ministraDateParam = { signDate: { $regex: new RegExp(`${paddedMonth}.${currentYear}$`) } };

            const count = await this.userService.getGainCountBy([{}, ministraDateParam]);

            return {
                count
            };
        } else {
            // Handle the case when newUsersLastMonth is undefined
        }

        if (newSubsLastMonth !== undefined) {
            const currentDate = new Date();

            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1; // Note: Months are zero-based, so add 1

            console.log(currentYear + "" + currentMonth);

            const paddedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

            const ministraDateParam = { ministraDate: { $regex: new RegExp(`${paddedMonth}.${currentYear}$`) } };

            const count = await this.userService.getGainCountBy([{ ministraDate: { $exists: true }}, ministraDateParam]);

            console.log(count + "" + "avboaobab");

            return {
                count
            };
        } else {
            // Handle the case when newUsersLastMonth is undefined
        }

        if (newPremiumLastMonth !== undefined) {
            const currentDate = new Date();

            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1; // Note: Months are zero-based, so add 1

            console.log(currentYear + "" + currentMonth);

            const paddedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

            const ministraDateParam = {
                ministraDate: { $regex: new RegExp(`${paddedMonth}.${currentYear}$`) },
                subLevel: 3
            };

            const count = await this.userService.getGainCountBy([{ ministraDate: { $exists: true }, subLevel: 3}, ministraDateParam]);

            console.log(count + "" + "avboaobab");

            return {
                count
            };
        } else {
            // Handle the case when newUsersLastMonth is undefined
        }


    }

}