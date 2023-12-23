import {MiddlewareConsumer, Module, NestModule, RequestMethod} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "../users/user.schema";
import {Token, TokenSchema} from "../token/token.schema";
import {SessionAuth, SessionAuthSchema} from "../socket/sessionAuth.schema";
import {TokenModule} from "../token/token.module";
import {SocketModule} from "@nestjs/websockets/socket-module";
import {ConfigService} from "@nestjs/config";
import {SocketGateway} from "../socket/socket.gateway";
import {JwtService} from "@nestjs/jwt";
import {AuthController} from "./auth.controller";
import {authMiddleware} from "../middlewares/auth-middleware";
import {PasswordRenewal, PasswordRenewalSchema} from "../users/renewalPassword.schema";


@Module({
    imports:[
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        MongooseModule.forFeature([{name: Token.name, schema: TokenSchema}]),
        MongooseModule.forFeature([{name: SessionAuth.name, schema: SessionAuthSchema}]),
        MongooseModule.forFeature([{name: PasswordRenewal.name, schema: PasswordRenewalSchema}]),
        TokenModule,
        SocketModule,
    ],
    providers:[AuthService, ConfigService, SocketGateway, JwtService],
    exports:[AuthService],
    controllers:[AuthController]
})
export class AuthModule implements NestModule{
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(authMiddleware)
            .forRoutes(
                {path: 'auth/submitTvAuth', method: RequestMethod.POST,}
            )
    }
}