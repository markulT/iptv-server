import {Token, TokenSchema} from './../token/token.schema';
import {TokenModule} from './../token/token.module';
import {ConfigService} from '@nestjs/config';
import {TokenService} from './../token/token.service';
import {User, UserSchema} from './user.schema';
import {MongooseModule} from '@nestjs/mongoose';
import {UserService} from './user.service';
import {UserController} from './user.controller';
import {forwardRef, MiddlewareConsumer, Module, NestModule, RequestMethod} from "@nestjs/common";
import {JwtService} from '@nestjs/jwt';
import {authMiddleware} from 'src/middlewares/auth-middleware';
import {MailService} from "../mail/mail.service";
import {SessionAuth, SessionAuthSchema} from "../socket/sessionAuth.schema";
import {SocketServerProvider} from "@nestjs/websockets/socket-server-provider";
import {SocketModule} from "@nestjs/websockets/socket-module";
import {SocketIOModule} from "../socket/socket.module";


@Module({
    imports: [
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        MongooseModule.forFeature([{name: Token.name, schema: TokenSchema}]),
        MongooseModule.forFeature([{name: SessionAuth.name, schema: SessionAuthSchema}]),
        TokenModule,
        SocketModule,
        forwardRef(()=>SocketIOModule)
    ],
    controllers: [UserController],
    providers: [UserService, JwtService, TokenService, ConfigService, MailService, ConfigService, SocketServerProvider],
    exports: [UserService]
})
export class UserModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(authMiddleware)
            .forRoutes(
                {path: 'api/users', method: RequestMethod.GET,},
                {path: 'api/getFullProfile', method: RequestMethod.GET,},
                {path: 'api/submitTvAuth', method: RequestMethod.POST,}
            )
    }
}