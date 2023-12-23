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
import {RequestMetricJob} from "./customMetrics/requestMetricJob";
import {RequestMetricsService} from "./customMetrics/requestMetrics.service";
import {RequestMetricMiddleware} from "./customMetrics/requestMetricMiddleware";
import {AnalyticsModule} from "./analytics/analytics.module";
import {PasswordRenewalCleanerTaskService} from "./users/passwordRenewalCleanerTask.service";
import {PasswordRenewal, PasswordRenewalSchema} from "./users/renewalPassword.schema";


@Module({
    imports: [
        ScheduleModule.forRoot(),
        MongooseModule.forRoot('mongodb+srv://root:DEIQqBc7zPSiWqVp@cluster0.fvtyf.mongodb.net/?retryWrites=true&w=majority'),
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        MongooseModule.forFeature([{name:Admin.name, schema:AdminSchema}]),
        MongooseModule.forFeature([{name: PasswordRenewal.name, schema: PasswordRenewalSchema}]),
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
        AnalyticsModule,
        ScheduleModule.forRoot(),
        PrometheusModule.register()
    ],
    controllers: [AppController],
    providers: [AppService, {
        provide: APP_INTERCEPTOR,
        useValue: new RavenInterceptor()
    }, JwtService, RequestMetricJob, RequestMetricsService, PasswordRenewalCleanerTaskService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestMetricMiddleware).forRoutes("*")
    }
}

// DEIQqBc7zPSiWqVp