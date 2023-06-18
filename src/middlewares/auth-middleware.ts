import { Injectable, NestMiddleware } from "@nestjs/common";
// import ApiError from "src/exceptions/api-error";
import { TokenService } from "src/token/token.service";
import {log} from "util";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";

// export function authMiddleware(req, res, next) {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader) {
//             return next(Error('Unauthorized error'))
//         }
//         const accessToken = authHeader.split(' ')[1]
//         if (!accessToken) {
//             return next(Error('Unauthorized error'))
//         }
//     } catch (error) {
//         return next(Error('Unauthorized error'))
//     }
// }
@Injectable()
export class authMiddleware implements NestMiddleware {
    constructor(
        private tokenService: TokenService,
        @InjectModel(User.name) private readonly userModel:Model<UserDocument>
    ) {

    }
    async use(req: any, res: any, next: (error?: any) => void) {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(res.status(401).send('User'))
        }
        const accessToken = authHeader.split(' ')[1]
        if (!accessToken) {
            return next(res.status(401).send('User'))
        }
        const userData = this.tokenService.validateAccessToken(accessToken)
        if (!userData) {
            return next(res.status(401).send('User'))
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const user = await this.userModel.findOne({email:userData.email})

        req.user = userData
        next()

    }
}