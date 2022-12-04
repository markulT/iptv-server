import {ConfigService} from '@nestjs/config';
import {Token, TokenDocument} from './token.schema';
import {Model} from 'mongoose';
import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import * as jwt from 'jsonwebtoken'


@Injectable()
export class TokenService {
    constructor(
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        private configService: ConfigService,
    ) {
    }

    generateToken(payload) {
        const accessToken = jwt.sign(payload, this.configService.get('JWT_ACCESS_SECRET'), {expiresIn: '30m'})
        const refreshToken = jwt.sign(payload, this.configService.get('JWT_REFRESH_SECRET'), {expiresIn: '30d'})
        return {
            accessToken,
            refreshToken
        }
    }

    async saveToken(userId, refreshToken) {

        const tokenData = await this.tokenModel.findOne({user: userId})
        if (tokenData) {
            tokenData.refreshToken = refreshToken
            await tokenData.save()

            return tokenData
        }
        const token = await this.tokenModel.create({user: userId, refreshToken})
        return token
    }

    async removeToken(refreshToken) {
        const token = await this.tokenModel.deleteOne({refreshToken})
        return token
    }

    async validateRefreshToken(refreshToken) {
        try {
            const userData = jwt.verify(refreshToken, this.configService.get('JWT_REFRESH_SECRET'))
            return userData
        } catch (error) {
            return null
        }
    }

    validateAccessToken(accessToken) {
        try {
            const userData = jwt.verify(accessToken, this.configService.get('JWT_ACCESS_SECRET'))

            return userData
        } catch (error) {
            return null
        }
    }

    async findToken(refreshToken) {
        const userData = await this.tokenModel.findOne({refreshToken:refreshToken})
        return userData
    }
}