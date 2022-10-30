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
    async register(login:string, password:string,fullName:string, role:RoleEnum):Promise<SuccessResponse> {
        const candidate = await this.adminModel.findOne({login})
        if(candidate) {
            throw new HttpException('User already exists',HttpStatus.NOT_ACCEPTABLE)
        }
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const user = await this.adminModel.create({login, password:hashedPassword,fullName:fullName, role:role })
        const adminDto = new AdminDto(user)
        const tokens = this.tokenService.generateToken({...AdminDto})
        await this.tokenService.saveToken(adminDto.id, tokens.refreshToken)
        return {
            ...tokens,
            admin:adminDto
        }
    }
    async login (login:string, password:string):Promise<SuccessResponse> {
        const admin = await this.adminModel.findOne({login})
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
        console.log('Successfully logined')
        return {
            ...tokens,
            admin:adminDto
        }
    }
    async getAdmin(login) {
        return await this.adminModel.findOne({login})
    }
    async refresh(refreshToken):Promise<SuccessResponse> {


        if(!refreshToken) {
            throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED)
        }
        const adminData = await this.tokenService.validateRefreshToken(refreshToken)
        const tokenFromDb = await this.tokenService.findToken(refreshToken)
        if(!adminData || !tokenFromDb) {
            console.log('negor')
            throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED)
        }
        const admin = await this.adminModel.findById(tokenFromDb.user)
        const adminDto = new AdminDto(admin)
        const tokens = this.tokenService.generateToken({...adminDto})

        await this.tokenService.saveToken(adminDto.id, tokens.refreshToken)
        console.log({
            ...tokens,
            admin:adminDto
        })
        return {
            ...tokens,
            admin:adminDto
        }

    }
    async createClient(login: string, password: string, fullName: string, email:string, phone:string, address:string) {
        const candidate = await this.userModel.findOne({ login })
        if (candidate) {
            throw new HttpException('User already exists', HttpStatus.CONFLICT)
        }

        const uniqueEmail = await this.userModel.findOne({email})
        console.log(uniqueEmail)
        if(uniqueEmail?.isActivated) {
            throw new HttpException('email already exists', HttpStatus.CONFLICT)
        }
        // create user
        const saltOrRounds = 12;
        const hash = await bcrypt.hash(password, saltOrRounds);
        const activationLink = await uuid.v4()
        const user = await this.userModel.create({ login, password: hash, fullName, activationLink, phone, address, email })

        // create and save jwts

        await this.mailService.sendActivationEmail(email, activationLink)

        return {
            user
        }
    }
    async deleteClient(id) {
        await this.userModel.findByIdAndDelete(id)
    }

    async cancelSub(id:string) {
        const user = await this.userModel.findById(id)
        const isUserSubbed = await this.payService.isUserSubed(user.login, 'mobileSubOrderId')
        console.log(isUserSubbed)
        if (typeof isUserSubbed == 'string') {
            const result = await this.payService.cancelMobileSub({login:user.login, password:user.password,orderId:user.mobileSubOrderId}, false)
            return result
        }
        return 'йди нахуй'
    }
}