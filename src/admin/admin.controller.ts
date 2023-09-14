import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query, Req, Res} from "@nestjs/common";
import {AdminService} from "./admin.service";
import {Action, CaslAbilityFactory} from "../casl/casl-ability.factory";
import {Response} from "express";
import {RoleEnum} from "./role.enum";
import {User} from "../users/user.schema";
import {UserService} from "../users/user.service";
import {PayService} from "../payments/pay.service";
import {MailService} from "../mail/mail.service";


@Controller('/admin')
export class AdminController {
    constructor(
        private adminService:AdminService,
        private abilityFactory: CaslAbilityFactory,
        private userService: UserService,
        private payService: PayService,
        private mailService: MailService
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
        const email:string = body.login
        const fullName:string = body.fullName
        const password:string = body.password
        const role:RoleEnum = body.role

        const adminData = await this.adminService.register(email, password, fullName, role)
        res.cookie('refreshToken', adminData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
        return {
            adminData
        }
    }
    @Post('/login')
    async login(@Body() body, @Res({passthrough:true}) res:Response){
        const email:string = body.login
        const password:string = body.password

        const adminData = await this.adminService.login(email, password)
        res.cookie('refreshToken', adminData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
        return {
            adminData
        }
    }
    @Post('/createClient')
    async createClient(@Body() body, @Req() req, @Res({passthrough: true}) res:Response) {
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        const isAllowed = ability.can(Action.Delete, User)
        if(!isAllowed) {throw new HttpException("FORBIDDEN", HttpStatus.FORBIDDEN)}

        // const login = body.login
        const password = body.password
        const fullName = body.fullName
        const email = body.email
        const phone = body.phone
        const address = body.address

        const user = await this.adminService.createClient(password,fullName,email,phone,address)
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
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const users = await this.userService.getUsers()
        return {
            users
        }
    }
    @Get('/getUsersBy')
    async getUsersBy(@Req() req, @Query() query) {
        const activated = query.activated;
        const unactivated = query.unactivated;
        const subscription = query.subscription;
        const signDate = query.signDate;
        const ministraDate = query.ministraDate;
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        console.log(subscription)
        if (subscription !== undefined) {
            const users = await this.userService.getUsersBy({ subLevel: Number(subscription) })
            return {
                users
            }
        } else {

        }
        if (signDate !== undefined) {
            const parts = signDate.split('-');
            const month = parts[0];
            const year = parts[1];
            const regexPattern = new RegExp(`${month}.${year}$`);
            const users = await this.userService.getUsersBy({ signDate: { $regex: regexPattern } })
            return {
                users
            }
        } else {

        }

        if (ministraDate !== undefined) {
            const parts = ministraDate.split('-');
            const month = parts[0];
            const year = parts[1];
            const regexPattern = new RegExp(`${month}.${year}$`);
            const users = await this.userService.getUsersBy({ ministraDate: { $regex: regexPattern } })
            return {
                users
            }
        } else {

        }

        if (activated !== undefined) {
            const users = await this.userService.getUsersBy({ isActivated: true })
            return {
                users
            }
        } else {
        }

        if (unactivated !== undefined) {
            const users = await this.userService.getUsersBy({ isActivated: false })
            return {
                users
            }
        } else {
        }

    }


    @Get('/getPage')
    async getPage(@Req() req, @Param() param, @Query() reqParam) {
        const adminAuth = req.user
        const pageId = reqParam.pageId
        const pageSize = reqParam.pageSize
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const page = await this.userService.getPage(pageId, pageSize)
        const lenght = await this.userService.getLength()
        return {
            lenght, page
        }
    }

    @Get('/getPageBy')
    async getPageBy(@Req() req, @Query() query) {
        const adminAuth = req.user;
        const pageId = query.pageId;
        const pageSize = query.pageSize;
        const isActivatedFilter = query.isActivated; // Example filter parameter
        const registeredFilter = query.registered; // Example filter parameter
        const subscriptionFilter = query.subscription; // Example filter parameter

        const admin = await this.adminService.getAdmin(adminAuth.email);
        const ability = this.abilityFactory.defineAbility(admin);

        if (!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        // Define a filters object with defaults
        const filters: Record<string, any> = {};

        console.log(isActivatedFilter)

        if (isActivatedFilter !== undefined) {
            // Convert the string to a boolean if needed
            filters.isActivated = isActivatedFilter === 'true';
        } else {
        }

        if (subscriptionFilter !== undefined) {
            // Convert the string to a boolean if needed
            filters.subLevel = Number(subscriptionFilter);
        } else {
        }


        const page = await this.userService.getPageBy(pageId, pageSize, filters);

        console.log(registeredFilter)
        const length = await this.userService.getPagesLength(filters); // You may want to implement a filter count method as well

        if (registeredFilter !== undefined) {
            // Convert the string to a boolean if needed
            const currentDate = new Date();
            const updatedDate = new Date(currentDate);
            updatedDate.setMonth(currentDate.getMonth() - registeredFilter);

            const filteredUsers = page.filter((user) => {
                const userSignDate = new Date(user.signDate);

                console.log(userSignDate)
                console.log(updatedDate)
                console.log(userSignDate < updatedDate)
                return userSignDate < updatedDate;
            });
            return { length, page: filteredUsers }; // Use the same property name "page"
        } else {
            return { length, page }; // Use the same property name "page"
        }
    }


    @Get(`/getUser/:id`)
    async getUser(@Req() req, @Param() param) {
        const adminAuth = req.user
        const userId = param.id
        const admin = await this.adminService.getAdmin(adminAuth.email)
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
        const admin = await this.adminService.getAdmin(adminAuth.email)
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
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const users = await this.userService.findUsers(regex)
        return {users}
    }

    @Delete('/cancelMobileSub/:id')
    async cancelMobileSub(@Param() param, @Req() req) {
        const adminAuth = req.user
        const id:string = param.id
        const admin = await this.adminService.getAdmin(adminAuth.email)
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
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Delete, User)) {
            throw new HttpException('Недостаточно прав', HttpStatus.FORBIDDEN)
        }
        const result = this.adminService.cancelMinistraSub(id)
        return result
    }

    @Get('/getSubsInfo')
    async getSubsInfo(@Req() req, @Param() param, @Query() reqParam) {
        const adminAuth = req.user
        const pageId = reqParam.pageId
        const pageSize = reqParam.pageSize
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }
        const page = await this.userService.getPage(pageId, pageSize)
        const lenght = await this.userService.getLength()
        return {
            lenght, page
        }
    }

    @Post('/sendTestEmail')
    async sendTestEmail(@Req() req, @Body() body) {
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.email)
        const ability = this.abilityFactory.defineAbility(admin)
        if(!ability.can(Action.Read, User)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
        }

        const emails = body.emails
        const title = body.title
        const paragraph = body.paragraph

        console.log(emails)
        console.log(title)
        console.log(paragraph)

        return this.mailService.sendTestEmail({emails, title, paragraph})
    }
}