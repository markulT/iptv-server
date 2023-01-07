import { errorMiddleware } from './middlewares/error-middleware';
import {HttpException, MiddlewareConsumer, NestModule} from '@nestjs/common';
import { UserModule } from './users/user.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';
import { ConfigModule } from '@nestjs/config';
import {PayModule} from "./payments/pay.module";
import {MinistraModule} from "./ministraTV/ministra.module";
import {AdminModule} from "./admin/admin.module";
import { CaslModule } from './casl/casl.module';
import { KalturaModule } from './kaltura/kaltura.module';
import { OttModule } from './ott/ott.module';
import {RavenInterceptor, RavenModule} from "nest-raven";
import {APP_INTERCEPTOR} from "@nestjs/core";
import {ChannelManagementModule} from "./channelManagement/channelManagement.module";

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://root:DEIQqBc7zPSiWqVp@cluster0.fvtyf.mongodb.net/?retryWrites=true&w=majority'),
    UserModule,
    TokenModule,
    ConfigModule.forRoot(),
    PayModule,
    MinistraModule,
    AdminModule,
    CaslModule,
    KalturaModule,
    OttModule,
    RavenModule,
    ChannelManagementModule
  ],
  controllers: [AppController],
  providers: [AppService,{
    provide: APP_INTERCEPTOR,
    useValue: new RavenInterceptor()
  }],
})
export class AppModule { }
// DEIQqBc7zPSiWqVp