import {HttpException, HttpStatus, Injectable, NestMiddleware} from "@nestjs/common";
import {TokenService} from "../token/token.service";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../users/user.schema";
import {Model} from "mongoose";


@Injectable()
export class SubscriptionMiddleware implements NestMiddleware {

    constructor(
        private tokenService: TokenService,
        @InjectModel(User.name) private readonly userModel:Model<UserDocument>
    ) {

    }

    async use(req: any, res: any, next: (error?: any) => void){
        console.log('sub middleware')
        const userData = req.user;
        console.log(userData)
        const user:User = await this.userModel.findOne({email:userData.email})
        if(user.mobileSubLevel == 0) {
            // throw new HttpException("Please buy a subscription first",HttpStatus.FORBIDDEN)
            return next(res.status(403).send('Please buy a subscription first'))
        }
        req.isSubbed = true
        next();
    }

}