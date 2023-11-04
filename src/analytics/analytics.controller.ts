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
import {RoleEnum} from "../admin/role.enum";
import {AdminService} from "../admin/admin.service";
import {User} from "../users/user.schema";


@Controller('/analytics')
export class AnalyticsController {
    constructor(
        private abilityFactory: CaslAbilityFactory,
        private userService: UserService,
        private adminService: AdminService,
        private payService: PayService,
        private mailService: MailService,
        private analyticsService: AnalyticsService,
    ) {
    }

    @Get("/test")
    test(): string {
        return this.analyticsService.test()
    }

    @Get("/updateTypesMongo")
    async updateTypesMongo(@Req() req, @Query() query) {
        const url = 'mongodb+srv://root:DEIQqBc7zPSiWqVp@cluster0.fvtyf.mongodb.net/?retryWrites=true&w=majority';
        const dbName = 'test';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const MongoClient = require('mongodb').MongoClient;

        const client = new MongoClient(url, {useUnifiedTopology: true});

        try {
            await client.connect();
            const db = client.db(dbName);

            // Replace 'dateStringField' and 'newDateField' with your field names
            const collection = db.collection('users');


            await collection.updateMany(
                {
                    signDate: {
                        $regex: /^[0-9]{2}.[0-9]{2}.[0-9]{4}$/,
                    },
                },
                [
                    {
                        $set: {
                            signDate: {
                                $dateFromString: {
                                    dateString: "$signDate",
                                    format: "%d.%m.%Y",
                                },
                            },
                        },
                    },
                ]
            );

        } finally {
            client.close();
        }
    }

    @Get('/getChartBy')
    async getChartBy(@Req() req, @Query() query) {
        const activated = query.activated;
        const subscription = query.subscription;
        const signDate = query.signDate;
        const ministraDate = query.ministraDate;
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if (!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }

        if (subscription !== undefined) {

            const filters: Record<string, any> = {};
            admin.role == RoleEnum.Dealer ? filters.dealer = admin.email : ""
            const subLevels = [0, 1, 2, 3, 4];

            const params = subLevels.map(subLevel => ({subLevel, ...filters}));

            const count = await this.userService.getCountsForMultipleParams(params);

            return {
                count
            }
        } else {

        }
        if (signDate !== undefined) {
            const dateParams = [];

            for (let i = 1; i <= 12; i++) {

                const startOfMonth = new Date(2023, i - 1, 1);
                const endOfMonth = new Date(2023, i, 1);
                const ministraDateParam: Record<string, any> = {
                    signDate: {
                        $gte: startOfMonth,
                        $lt: endOfMonth
                    }
                };

                if (admin.role === RoleEnum.Dealer) {
                    ministraDateParam.dealer = admin.email;
                }

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

                const startOfMonth = new Date(2023, i - 1, 1);
                const endOfMonth = new Date(2023, i, 1);

                const ministraDateParam: Record<string, any> = {
                    ministraDate: {
                        $gte: startOfMonth,
                        $lt: endOfMonth
                    },
                    subLevel: {$lt: 4}
                };

                if (admin.role === RoleEnum.Dealer) {
                    ministraDateParam.dealer = admin.email;
                }

                dateParams.push(ministraDateParam);
            }

            const count = await this.userService.getCountsForMultipleParams(dateParams)


            return {
                count
            }
        } else {

        }


        if (activated !== undefined) {
            const filters: Record<string, any> = {};
            admin.role == RoleEnum.Dealer ? filters.dealer = admin.email : ""
            const subLevels = [false, true];

            const params = subLevels.map(isActivated => ({isActivated: isActivated, ...filters}));

            const count = await this.userService.getCountsForMultipleParams(params);
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
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if (!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }

        if (newUsersLastMonth !== undefined) {
            const currentDate = new Date();

            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1; // Note: Months are zero-based, so add 1


            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            const endOfMonth = new Date(currentYear, currentMonth, 1);

            const wholeTimeData: Record<string, any> = {

            };

            const currentMonthData: Record<string, any> = {
                signDate: {
                    $gte: startOfMonth,
                    $lt: endOfMonth
                },
            };

            admin.role == RoleEnum.Dealer ? currentMonthData.dealer = admin.email : ""
            admin.role == RoleEnum.Dealer ? wholeTimeData.dealer = admin.email : ""

            const count = await this.userService.getGainCountBy([currentMonthData, wholeTimeData]);

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

            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            const endOfMonth = new Date(currentYear, currentMonth, 1);


            const wholeTimeData: Record<string, any> = {
                ministraDate: {
                    $exists: true
                },
                subLevel: {$gt: 0, $lt: 4}
            };

            if (admin.role === RoleEnum.Dealer) {
                wholeTimeData.dealer = admin.email;
            }
            const currentMonthData: Record<string, any> = {
                ministraDate: {
                    $gte: startOfMonth,
                    $lt: endOfMonth
                }, subLevel: {$gt: 0, $lt: 4}
            };
            admin.role == RoleEnum.Dealer ? currentMonthData.dealer = admin.email : ""
            admin.role == RoleEnum.Dealer ? wholeTimeData.dealer = admin.email : ""

            const count = await this.userService.getGainCountBy([currentMonthData, wholeTimeData]);
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

            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            const endOfMonth = new Date(currentYear, currentMonth, 1);

            const wholeTimeData: Record<string, any> = {
                ministraDate: {$ne: null},
                subLevel: 3
            };

            if (admin.role === RoleEnum.Dealer) {
                wholeTimeData.dealer = admin.email;
            }

            const currentMonthData: Record<string, any> = {
                ministraDate: {
                    $gte: startOfMonth,
                    $lt: endOfMonth
                },
                subLevel: 3
            };
            admin.role == RoleEnum.Dealer ? currentMonthData.dealer = admin.email : ""
            admin.role == RoleEnum.Dealer ? wholeTimeData.dealer = admin.email : ""


            const count = await this.userService.getGainCountBy([currentMonthData, wholeTimeData]);


            return {
                count
            };
        } else {
            // Handle the case when newUsersLastMonth is undefined
        }


    }

}