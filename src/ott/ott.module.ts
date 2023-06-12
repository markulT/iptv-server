import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import { OttController } from './ott.controller';
import { OttService } from './ott.service';
import {authMiddleware} from "../middlewares/auth-middleware";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "../users/user.schema";
import {TokenService} from "../token/token.service";
import {Token, TokenSchema} from "../token/token.schema";
import {TokenModule} from "../token/token.module";
import {ConfigService} from "@nestjs/config";
import {SocketModule} from "@nestjs/websockets/socket-module";

@Module({
  imports:[
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    TokenModule,
    SocketModule
  ],
  controllers: [OttController],
  providers: [OttService, TokenService, ConfigService]
})
export class OttModule implements NestModule{
  configure(consumer: MiddlewareConsumer): any {
    consumer
        .apply(authMiddleware)
        .forRoutes(OttController)
  }
}
