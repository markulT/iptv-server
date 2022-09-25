import { errorMiddleware } from './middlewares/error-middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
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
    OttModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
// DEIQqBc7zPSiWqVp