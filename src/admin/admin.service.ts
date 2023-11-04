import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {TokenService} from "../token/token.service";
import {InjectModel} from "@nestjs/mongoose";
import {Admin, AdminDocument} from "./admin.schema";
import {Model} from "mongoose";
import {RoleEnum} from "./role.enum";
import * as bcrypt from 'bcrypt'
import {AdminDto} from "./admin.dto";
import {UserService} from "../users/user.service";
import {User, UserDocument} from "../users/user.schema";
import * as uuid from 'uuid'
import {MailService} from "../mail/mail.service";
import {PayService} from "../payments/pay.service";

type ErrorResponse = {
    status:number,
    message:string
}
type SuccessResponse = {
    accessToken:string,
    refreshToken:string,
    admin:AdminDto
}

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private readonly userModel:Model<UserDocument>,
        @InjectModel(Admin.name) private readonly adminModel:Model<AdminDocument>,
        private tokenService:TokenService,
        private userService:UserService,
        private mailService:MailService,
        private payService:PayService
    ) {
    }
    test():string {
        return 'works'
    }

    async logout(refreshToken) {
        try {
            const token = await this.tokenService.removeToken(refreshToken)
            return token
        } catch (error) {
        }
    }

    async getAdmins() {
       return this.adminModel.find()
    }

    async getDealers() {
        return this.adminModel.find({role: RoleEnum.Dealer})
    }

    async register(email:string, password:string,fullName:string, role:RoleEnum):Promise<SuccessResponse> {
        const candidate = await this.adminModel.findOne({email:email})
        if(candidate) {
            throw new HttpException('User already exists',HttpStatus.NOT_ACCEPTABLE)
        }
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const user = await this.adminModel.create({email, password:hashedPassword,fullName:fullName, role:role })
        const adminDto = new AdminDto(user)
        const tokens = this.tokenService.generateToken({...adminDto})
        await this.tokenService.saveToken(adminDto.id, tokens.refreshToken)
        return {
            ...tokens,
            admin:adminDto
        }
    }
    async login (email:string, password:string):Promise<SuccessResponse> {
        const admin = await this.adminModel.findOne({email})
        if(!admin) {
            throw new HttpException('User does not exist', HttpStatus.NOT_FOUND)
        }
        const isPassCorrect = await bcrypt.compare(password, admin.password)
        if(!isPassCorrect) {
            throw new HttpException('Wrong password', HttpStatus.FORBIDDEN)
        }
        const adminDto = new AdminDto(admin)
        const tokens = this.tokenService.generateToken({...adminDto})
        await this.tokenService.saveToken(adminDto.id, tokens.refreshToken)
        return {
            ...tokens,
            admin:adminDto
        }
    }
    async getAdmin(email) {
        return this.adminModel.findOne({email});
    }

    async refresh(refreshToken):Promise<SuccessResponse> {

        if(!refreshToken) {
            throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED)
        }
        const adminData = await this.tokenService.validateRefreshToken(refreshToken)
        const tokenFromDb = await this.tokenService.findToken(refreshToken)
        if(!adminData || !tokenFromDb) {
            throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED)
        }
        const admin = await this.adminModel.findById(tokenFromDb.user)
        const adminDto = new AdminDto(admin)
        const tokens = this.tokenService.generateToken({...adminDto})

        await this.tokenService.saveToken(adminDto.id, tokens.refreshToken, refreshToken)
        return {
            ...tokens,
            admin:adminDto
        }

    }
    async createClient(password: string, fullName: string, email:string, phone:string, address:string, dealer:string) {
        // const candidate = await this.userModel.findOne({ email })
        // if (candidate) {
        //     throw new HttpException('User already exists', HttpStatus.CONFLICT)
        // }

        const uniqueEmail = await this.userModel.findOne({email})
        if(uniqueEmail?.isActivated) {
            throw new HttpException('email already exists', HttpStatus.CONFLICT)
        }
        // create user
        const saltOrRounds = 12;
        const hash = await bcrypt.hash(password, saltOrRounds);
        const activationLink = await uuid.v4()
        const date = new Date()
        const trialExpirationDate = new Date(date);
        trialExpirationDate.setDate(trialExpirationDate.getDate() + 14);
        const user = await this.userModel.create(
            { password: hash,
            fullName, activationLink,
            phone,
            address,
            email,
            signDate:date,
            ministraDate:date,
            subLevel: 4,
            tvSubLevel: 4,
            mobileSubLevel: 4,
            freeTrialUsed: false,
            mobileSubOrderId: "TRIAL",
            mobileSubExists:true,
            orderId: "TRIAL",
            trialExpirationDate: trialExpirationDate,
            dealer:dealer})

        // create and save jwts

        await this.mailService.sendActivationEmail(email, activationLink)

        return {
            user
        }
    }
    async deleteClient(id) {
        const user = await this.userModel.findById(id)
        await this.userModel.findByIdAndDelete(id)
    }

    async deleteAdmin(id) {
        const admin = await this.adminModel.findById(id)
        await this.adminModel.findByIdAndDelete(id)
    }

    async cancelSub(id:string) {
        const user = await this.userModel.findById(id)
        const isUserSubbed = await this.payService.isUserSubed(user.email, 'mobileSubOrderId')
        if (typeof isUserSubbed == 'string') {
            const result = await this.payService.cancelMobileSub({email:user.email, password:user.password,orderId:user.mobileSubOrderId}, false)
            return result
        }
        return 'No sub available to remove'
    }
    async cancelMinistraSub(id:string) {
        const user = await this.userModel.findById(id)
        const isUserSubbed = await this.payService.isUserSubed(user.email,'orderId')
        if(typeof isUserSubbed == 'string') {
            const result = await this.payService.cancelSubscription(user.email, user.password, false)
            return result
        }
        return 'No sub available to remove'

    }

    async createTestSub(id:string, time: string) {
        const date = new Date()
        const dateParts = time.split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed, so subtract 1.
        const day = parseInt(dateParts[2], 10);

        const dateObject = new Date(year, month, day);
        const user = await this.userModel.findById(id)

        user.ministraDate = date
        user.trialExpirationDate = dateObject
        user.subLevel = 4
        user.tvSubLevel = 4
        user.mobileSubLevel = 4
        user.freeTrialUsed = false
        user.mobileSubOrderId = "TRIAL"
        user.mobileSubExists = true
        user.orderId = "TRIAL"
        user.save()

        return {
            user
        }
    }
}