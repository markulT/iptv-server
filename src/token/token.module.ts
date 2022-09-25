import { ConfigService } from '@nestjs/config';
import { Token, TokenSchema } from './token.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenService } from './token.service';
import { Module } from "@nestjs/common";


@Module({
    imports: [
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }])
    ],
    providers: [TokenService, ConfigService],
    exports: [TokenService]
})
export class TokenModule { }