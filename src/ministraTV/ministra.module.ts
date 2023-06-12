import {Module, NestModule} from "@nestjs/common";
import {authMiddleware} from "../middlewares/auth-middleware";
import {MinistraController} from "./ministra.controller";
import {MinistraService} from "./ministra.service";
import {MiddlewareConsumer} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "../users/user.schema";
import {TokenService} from "../token/token.service";
import {Token, TokenSchema} from "../token/token.schema";
import {ConfigService} from "@nestjs/config";
import {SocketModule} from "@nestjs/websockets/socket-module";


@Module({
    imports:[
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        SocketModule
    ],
    controllers:[MinistraController],
    providers:[MinistraService, TokenService, ConfigService]
})

export class MinistraModule implements NestModule{
    configure(consumer: MiddlewareConsumer): any {
        consumer
            .apply(authMiddleware)
            .forRoutes(MinistraController)
    }
}