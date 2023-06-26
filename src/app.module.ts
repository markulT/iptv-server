import {errorMiddleware} from './middlewares/error-middleware';
import {HttpException, MiddlewareConsumer, NestModule} from '@nestjs/common';
import {UserModule} from './users/user.module';
import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TokenModule} from './token/token.module';
import {ConfigModule} from '@nestjs/config';
import {PayModule} from "./payments/pay.module";
import {MinistraModule} from "./ministraTV/ministra.module";
import {AdminModule} from "./admin/admin.module";
import {CaslModule} from './casl/casl.module';
import {KalturaModule} from './kaltura/kaltura.module';
import {OttModule} from './ott/ott.module';
import {RavenInterceptor, RavenModule} from "nest-raven";
import {APP_INTERCEPTOR} from "@nestjs/core";
import {ChannelManagementModule} from "./channelManagement/channelManagement.module";
import {SocketGateway} from './socket/socket.gateway';
import {JwtService} from "@nestjs/jwt";
import {SocketModule} from "@nestjs/websockets/socket-module";
import {SocketIOModule} from "./socket/socket.module";
import {ScheduleModule} from "@nestjs/schedule";
import {PrometheusModule} from "@willsoto/nestjs-prometheus";
import {AdminMiddleware} from "./middlewares/adminMiddleware";
import {User, UserSchema} from "./users/user.schema";
import {Admin, AdminSchema} from "./admin/admin.schema";


@Module({
    imports: [
        MongooseModule.forRoot('mongodb+srv://root:DEIQqBc7zPSiWqVp@cluster0.fvtyf.mongodb.net/?retryWrites=true&w=majority'),
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        MongooseModule.forFeature([{name:Admin.name, schema:AdminSchema}]),
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
        ChannelManagementModule,
        SocketModule,
        SocketIOModule,
        ScheduleModule.forRoot(),
        PrometheusModule.register()
    ],
    controllers: [AppController],
    providers: [AppService, {
        provide: APP_INTERCEPTOR,
        useValue: new RavenInterceptor()
    }, JwtService],
})
export class AppModule  {}

// DEIQqBc7zPSiWqVp