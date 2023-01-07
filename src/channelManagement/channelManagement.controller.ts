import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Req, Res,
    UploadedFile, UseInterceptors
} from "@nestjs/common";
import {ChannelManagementService} from "./channelManagement.service";
import {Action, CaslAbilityFactory} from "../casl/casl-ability.factory";
import {UserService} from "../users/user.service";
import {ChannelPropEnum} from "../dtos/channel.dto";
import {Channel} from "./channelManagement.schema";
import {isSetIterator} from "util/types";
import {Ability} from "@casl/ability";
import {User} from "../users/user.schema";
import {AdminService} from "../admin/admin.service";
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
// import path from "path";
import {of} from "rxjs";
import {v4 as uuidv4} from 'uuid'
import * as fs from "fs";
import {log} from "util";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path")

@Controller("/channelManagement")
export class ChannelManagementController {
    constructor(
        private channelManagementService: ChannelManagementService,
        private abilityFactory:CaslAbilityFactory,
        private userService: UserService,
        private adminService:AdminService
    ) {
    }

    @Get("/getAll")
    public async getAll() {
        const channels = await this.channelManagementService.getAll()
        return channels
    }



    @Post("/create")
    @UseInterceptors(FileInterceptor('image', {
        storage:diskStorage({
            destination:"./files",
            filename:(req,file,cb)=>{
                // console.log(path.parse(file.originalname))
                const filename:string = path.parse(file.originalname).name.replace(/\s/g, "") +  uuidv4()
                const extension:string = path.parse(file.originalname).ext

                cb(null,`${filename}${extension}`)
            }
        })
    }))
    public async create(@Body() body, @Req() req, @UploadedFile() file:Express.Multer.File) {

        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        const isAllowed = ability.can(Action.Create, User)
        if(!isAllowed) {
            throw new HttpException("Недостаточно прав", HttpStatus.FORBIDDEN)
        }

        const name:string = body.name
        const description:string = body.description
        const title:string = body.title
        const imgBuffer = await fs.readFileSync("files/" + file.filename)
        const channel = await this.channelManagementService.create(name, title, description, imgBuffer, file.filename)
        await fs.unlink("files/" + file.filename, (err)=>{
            if (err) console.log(err)
        })
        return of({imagePath:file.path})

    }

    @Put("/editImage")
    @UseInterceptors(FileInterceptor('image', {
        storage:diskStorage({
            destination:"./files",
            filename:(req,file,cb)=>{
                // console.log(path.parse(file.originalname))
                const filename:string = path.parse(file.originalname).name.replace(/\s/g, "") +  uuidv4()
                const extension:string = path.parse(file.originalname).ext

                cb(null,`${filename}${extension}`)
            }
        })
    }))
    public async editImage(@Body() body, @Req() req, @UploadedFile() file:Express.Multer.File) {
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        const isAllowed = ability.can(Action.Update, User)
        if(!isAllowed) {
            throw new HttpException("Недостаточно прав", HttpStatus.FORBIDDEN)
        }
        const id = body.id
        const imgData = await fs.readFileSync("files/" + file.filename)
        await this.channelManagementService.editImage(id, imgData, file.filename)
        await fs.unlink("files/" + file.filename, (err)=>{
            if (err) console.log(err)
        })
        return "Aboba"
    }

    @Delete("/delete/:id")
    public async delete(@Param() param, @Req() req) {
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        const isAllowed = ability.can(Action.Delete, User)

        if(!isAllowed) {
            throw new HttpException("Недостаточно прав", HttpStatus.FORBIDDEN)
        }

        const id = param.id
        const channel = await this.channelManagementService.findChannelById(id)
        await fs.unlink("files/" + channel.imgName, (err)=>{
            if (err) console.log(err)
        })
        const deletedChannel = await this.channelManagementService.delete(id)
        return deletedChannel
    }
    @Put("/update")
    public async update(@Body() body, @Req() req) {

        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        const isAllowed = ability.can(Action.Update, User)

        if(!isAllowed) {
            throw new HttpException("Недостаточно прав", HttpStatus.FORBIDDEN)
        }

        const field = body.field
        const value = body.value
        const id = body.id

        const channel = this.channelManagementService.update(id, field, value)
        return channel
    }

    @Get("/getPage")
    async getPage(@Req() req, @Param() param, @Query() reqParam) {
        // const adminAuth = req.user
        // const admin = await this.adminService.getAdmin(adminAuth.login)
        // const ability = this.abilityFactory.defineAbility(admin)
        // const isAllowed = ability.can(Action.Read, User)
        // if(!isAllowed) {
        //     throw new HttpException("Недостаточно прав", HttpStatus.FORBIDDEN)
        // }
        const pageId = reqParam.pageId
        const pageSize:number = reqParam.pageSize
        console.log(`these mfs ${pageSize} ${pageId}`)
        const page = await this.channelManagementService.getPage(pageId,pageSize)
        const length = await this.channelManagementService.getLength()
        return {page, length}
    }

    @Post("/getImage")
    public async getImage(@Res() res, @Body() body) {
        const imgpath = body.imgpath
        return res.sendFile(imgpath, {root:'files'})
    }

    @Get("/getChannel/:id")
    public async getChannel(@Param() param) {
        const channel = await this.channelManagementService.findChannelById(param.id)
        return channel
    }

}