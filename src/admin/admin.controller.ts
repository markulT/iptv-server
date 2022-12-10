import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put, Query,
    Req,
    Res
} from "@nestjs/common";
import {AdminService} from "./admin.service";
import {Action, CaslAbilityFactory} from "../casl/casl-ability.factory";
import {Response} from "express";
import {RoleEnum} from "./role.enum";
import {User} from "../users/user.schema";
import {UserService} from "../users/user.service";
import {PayService} from "../payments/pay.service";


@Controller('/admin')
export class AdminController {
    constructor(
        private adminService:AdminService,
        private abilityFactory: CaslAbilityFactory,
        private userService: UserService,
        private payService: PayService
    ) {
    }
    @Get()
    test():string {
        return this.adminService.test()
    }

    @Post('/loginByToken')
    async getByToken(@Req() req) {
        const adminAuth = req.user
        return adminAuth
    }

    @Post('/register')
    async register(@Body() body, @Res({passthrough:true}) res:Response){
        const login:string = body.login
        const fullName:string = body.fullName
        const password:string = body.password
        const role:RoleEnum = body.role

        const adminData = await this.adminService.register(login, password, fullName, role)
        res.cookie('refreshToken', adminData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
        return {
            adminData
        }
    }
    @Post('/login')
    async login(@Body() body, @Res({passthrough:true}) res:Response){
        const login:string = body.login
        const password:string = body.password

        const adminData = await this.adminService.login(login, password)
        res.cookie('refreshToken', adminData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
        return {
            adminData
        }
    }
    @Post('/createClient')
    async createClient(@Body() body, @Req() req, @Res({passthrough: true}) res:Response) {
        console.log('pezdaaa')
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        const isAllowed = ability.can(Action.Delete, User)
        if(!isAllowed) {throw new HttpException("FORBIDDEN", HttpStatus.FORBIDDEN)}

        const login = body.login
        const password = body.password
        const fullName = body.fullName
        const email = body.email
        const phone = body.phone
        const address = body.address

        const user = await this.adminService.createClient(login,password,fullName,email,phone,address)
        console.log(user)
        return {
            user
        }
    }

    @Post('/refresh')
    async refresh(@Req() req, @Res({passthrough:true}) res) {
        const {refreshToken} = req.cookies

        const adminData = await this.adminService.refresh(refreshToken)
        res.cookie('refreshToken', adminData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })

        return {
            adminData
        }
    }
    @Get('/getUsers/')
    async getUsers(@Req() req) {
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const users = await this.userService.getUsers()
        return {
            users
        }
    }

    @Get('/getPage')
    async getPage(@Req() req, @Param() param, @Query() reqParam) {
        const adminAuth = req.user
        const pageId = reqParam.pageId
        const pageSize = reqParam.pageSize
        console.log(`${pageId} - ${pageSize}`)
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const page = await this.userService.getPage(pageId, pageSize)
        console.log(page)
        const lenght = await this.userService.getLenght()
        return {
            lenght, page
        }
    }

    @Get(`/getUser/:id`)
    async getUser(@Req() req, @Param() param) {
        const adminAuth = req.user
        const userId = param.id
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const user = this.userService.getUser(userId)
        return user
    }

    @Delete('/deleteClient/:id')
    async deleteClient(@Param() param, @Req() req) {
        const adminAuth = req.user
        const userId = param.id
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Delete, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const canceledSub = await this.adminService.cancelSub(userId)
        const canceledMobileSub = await this.adminService.cancelMinistraSub(userId)
        const status = await this.adminService.deleteClient(userId)
        return 'Successfully deleted'
    }

    @Get('/findClient/')
    async findClient(@Query() reqParam,@Req() req,@Res({passthrough:true}) res){
        const pageId = reqParam.pageId
        const pageSize = reqParam.pageSize
        const regex = reqParam.regex
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const users = await this.userService.findUsers(regex)
        console.log(users, 'finded users')
        return {users}
    }

    @Delete('/cancelMobileSub/:id')
    async cancelMobileSub(@Param() param, @Req() req) {
        const adminAuth = req.user
        const id:string = param.id
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Delete, User)) {
            throw new HttpException('Недостаточно прав', HttpStatus.FORBIDDEN)
        }
        const result = this.adminService.cancelSub(id)
        return result
    }
    @Delete('/cancelSub/:id')
    async cancelSub(@Param() param, @Req() req) {
        const adminAuth = req.user
        const id:string = param.id
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Delete, User)) {
            throw new HttpException('Недостаточно прав', HttpStatus.FORBIDDEN)
        }
        const result = this.adminService.cancelMinistraSub(id)
        return result
    }
}