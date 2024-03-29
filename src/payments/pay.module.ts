import {MiddlewareConsumer, Module, NestModule, RequestMethod} from "@nestjs/common";
import {PayController} from "./pay.controller";
import {PayService} from "./pay.service";
import {ConfigService} from "@nestjs/config";
import {authMiddleware} from "../middlewares/auth-middleware";
import {TokenModule} from "../token/token.module";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "../users/user.schema";
import {DailySubCheckService} from "./dailySubCheck";

@Module({
    imports:[
        TokenModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers:[PayController],
    providers:[PayService, ConfigService, DailySubCheckService]
})

export class PayModule implements NestModule {
    configure(consumer: MiddlewareConsumer): any {
        consumer
            .apply(authMiddleware)
            .exclude({path:'/payments/errorCallback', method:RequestMethod.ALL})
            .forRoutes(PayController)
    }
}