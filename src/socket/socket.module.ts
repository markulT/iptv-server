import {forwardRef, Module} from "@nestjs/common";
import {SocketGateway} from "./socket.gateway";
import {JwtService} from "@nestjs/jwt";
import {UserService} from "../users/user.service";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "../users/user.schema";
import {Token, TokenSchema} from "../token/token.schema";
import {SessionAuth, SessionAuthSchema} from "./sessionAuth.schema";
import {TokenModule} from "../token/token.module";
import {ConfigService} from "@nestjs/config";
import {MailService} from "../mail/mail.service";
import {SocketServerProvider} from "@nestjs/websockets/socket-server-provider";
import {SocketModule} from "@nestjs/websockets/socket-module";
import {TokenService} from "../token/token.service";
import {UserModule} from "../users/user.module";
import {AuthModule} from "../auth/auth.module";

@Module({
    imports:[
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        MongooseModule.forFeature([{name: Token.name, schema: TokenSchema}]),
        MongooseModule.forFeature([{name: SessionAuth.name, schema: SessionAuthSchema}]),
        TokenModule,
        SocketModule,
        // forwardRef(()=>UserModule),
        AuthModule,
    ],
    exports:[SocketGateway],
    providers:[JwtService, TokenService, ConfigService, MailService, ConfigService, SocketServerProvider, SocketGateway, ]
})
export class SocketIOModule {}