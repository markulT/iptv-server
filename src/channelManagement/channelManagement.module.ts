import {MiddlewareConsumer, Module, NestModule} from "@nestjs/common";
import {authMiddleware} from "../middlewares/auth-middleware";
import {MongooseModule} from "@nestjs/mongoose";
import {Admin, AdminSchema} from "../admin/admin.schema";
import {User, UserSchema} from "../users/user.schema";
import {Token, TokenSchema} from "../token/token.schema";
import {TokenModule} from "../token/token.module";
import {CaslModule} from "../casl/casl.module";
import {ChannelManagementController} from "./channelManagement.controller";
import {UserService} from "../users/user.service";
import {ChannelManagementService} from "./channelManagement.service";
import {AdminService} from "../admin/admin.service";
import {JwtService} from "@nestjs/jwt";
import {TokenService} from "../token/token.service";
import {ConfigService} from "@nestjs/config";
import {MailService} from "../mail/mail.service";
import {Channel, ChannelSchema} from "./channelManagement.schema";
import {PayService} from "../payments/pay.service";
import {MulterModule} from "@nestjs/platform-express";


@Module({
    imports:[
        MongooseModule.forFeature([{name:Admin.name, schema:AdminSchema}]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Channel.name, schema: ChannelSchema }]),
        CaslModule,
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        TokenModule,
        MulterModule.register({dest:"./files"})
    ],
    providers:[UserService,ChannelManagementService, AdminService, JwtService, TokenService, ConfigService, MailService, PayService],
    controllers:[ChannelManagementController]
})
export class ChannelManagementModule implements NestModule{
    configure(consumer: MiddlewareConsumer){
        consumer
            .apply(authMiddleware)
            .forRoutes(ChannelManagementController)
    }
}