import { ConfigService } from '@nestjs/config';
import { Token, TokenSchema } from './token.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenService } from './token.service';
import { Module } from "@nestjs/common";
import {SocketModule} from "@nestjs/websockets/socket-module";


@Module({
    imports: [
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        SocketModule
    ],
    providers: [TokenService, ConfigService],
    exports: [TokenService]
})
export class TokenModule { }