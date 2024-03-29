import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {OttController} from './ott.controller';
import {OttService} from './ott.service';
import {authMiddleware} from "../middlewares/auth-middleware";
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "../users/user.schema";
import {TokenService} from "../token/token.service";
import {Token, TokenSchema} from "../token/token.schema";
import {TokenModule} from "../token/token.module";
import {ConfigService} from "@nestjs/config";
import {SocketModule} from "@nestjs/websockets/socket-module";
import {SubscriptionMiddleware} from "../middlewares/subscriptionMiddleware";

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
        .exclude({path: '/ott/image', method:RequestMethod.ALL})
        .forRoutes(OttController)
        .apply(SubscriptionMiddleware)
        .exclude(
            {path:'/ott/image', method:RequestMethod.ALL},
                  {path:'/ott/searchMovies', method:RequestMethod.ALL},
            {path:'/ott/getAllMoviesLength', method:RequestMethod.ALL},
            {path:'/ott/moviesByGenreLength/:id', method:RequestMethod.ALL},
            {path:'/ott/moviesByGenre/:id', method:RequestMethod.ALL},
            {path:'/ott/getAllMovies', method:RequestMethod.ALL},

            )
        .forRoutes(OttController)
  }
}
