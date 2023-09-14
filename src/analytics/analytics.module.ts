import {MiddlewareConsumer, Module, NestModule, RequestMethod} from "@nestjs/common";
import {TokenService} from "../token/token.service";
import {MongooseModule} from "@nestjs/mongoose";
import {TokenModule} from "../token/token.module";
import {Token, TokenSchema} from "../token/token.schema";
import {ConfigService} from "@nestjs/config";
import {CaslModule} from "../casl/casl.module";
import {authMiddleware} from "../middlewares/auth-middleware";
import {UserService} from "../users/user.service";
import {User, UserSchema} from "../users/user.schema";
import {JwtService} from "@nestjs/jwt";
import {MailService} from "../mail/mail.service";
import {PayService} from "../payments/pay.service";
import {SocketServerProvider} from "@nestjs/websockets/socket-server-provider";
import {SessionAuth, SessionAuthSchema} from "../socket/sessionAuth.schema";
import {SocketModule} from "@nestjs/websockets/socket-module";
import {SocketIOModule} from "../socket/socket.module";
import {SocketGateway} from "../socket/socket.gateway";
import {AuthModule} from "../auth/auth.module";
import {AnalyticsController} from "./analytics.controller";
import {AnalyticsService} from "./analytics.service";
import {AdminModule} from "../admin/admin.module";
import {AdminService} from "../admin/admin.service";


@Module({
    imports:[
        // MongooseModule.forFeature([{name:Admin.name, schema:AdminSchema}]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        MongooseModule.forFeature([{name: SessionAuth.name, schema: SessionAuthSchema}]),
        TokenModule,
        CaslModule,
        SocketModule,
        SocketIOModule,
        AuthModule,
        AdminModule
    ],
    controllers:[AnalyticsController],
    providers:[AnalyticsService, TokenService, ConfigService, UserService, JwtService, MailService, PayService, SocketServerProvider, SocketGateway, AdminService]
})
export class AnalyticsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(authMiddleware)
            .forRoutes(AnalyticsController)
    }
}