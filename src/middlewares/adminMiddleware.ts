import {Injectable, NestMiddleware} from "@nestjs/common";
import {TokenService} from "../token/token.service";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";
import {Admin, AdminDocument} from "../admin/admin.schema";

@Injectable()
export class AdminMiddleware implements NestMiddleware {

    constructor(
        private tokenService:TokenService,
        @InjectModel(User.name) private readonly userModel:Model<UserDocument>,
        @InjectModel(Admin.name) private readonly adminModel:Model<AdminDocument>
    ) {
    }

    async use(req: any, res: any, next: (error?: any) => void) {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(res.status(401).send('Authentication error'))
        }
        const accessToken = authHeader.split(' ')[1]
        if (!accessToken) {
            return next(res.status(401).send('Authentication error'))
        }
        const userData = this.tokenService.validateAccessToken(accessToken)
        if (!userData) {
            return next(res.status(401).send('Authentication error'))
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const admin = await this.adminModel.findOne({email:userData.email})
        if (admin.role != "Admin") {
            return next(res.status(403).send('Not enough rights'))
        }
        console.log('went through adminMiddleware')
        req.user = userData
        next()
    }
}