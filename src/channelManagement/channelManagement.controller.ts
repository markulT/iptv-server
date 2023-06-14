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
    Req,
    Res,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {ChannelManagementService} from "./channelManagement.service";
import {Action, CaslAbilityFactory} from "../casl/casl-ability.factory";
import {UserService} from "../users/user.service";
import {Channel} from "./channelManagement.schema";
import {AdminService} from "../admin/admin.service";
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
// import path from "path";
import {of} from "rxjs";
import {v4 as uuidv4} from 'uuid'
import * as fs from "fs";
import axios from "axios";
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
        const isAllowed = ability.can(Action.Create, Channel)
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
        const isAllowed = ability.can(Action.Update, Channel)
        if(!isAllowed) {
            throw new HttpException("Недостаточно прав", HttpStatus.FORBIDDEN)
        }
        const id = body.id
        const imgData = await fs.readFileSync("files/" + file.filename)
        await this.channelManagementService.editImage(id, imgData, file.filename)
        await fs.unlink("files/" + file.filename, (err)=>{
            if (err) console.log(err)
        })
        return "image successfully edited"
    }

    @Delete("/delete/:id")
    public async delete(@Param() param, @Req() req) {
        const adminAuth = req.user
        const admin = await this.adminService.getAdmin(adminAuth.login)
        const ability = this.abilityFactory.defineAbility(admin)
        const isAllowed = ability.can(Action.Delete, Channel)

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
        const isAllowed = ability.can(Action.Update, Channel)
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
        // const isAllowed = ability.can(Action.Read, Channel)
        // if(!isAllowed) {
        //     throw new HttpException("Недостаточно прав", HttpStatus.FORBIDDEN)
        // }
        const pageId = reqParam.pageId
        const pageSize:number = reqParam.pageSize
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

    @Get("/test")
    public async test(@Req() req) {
        const ipRequest = req.header('x-forwarded-for')
        // await this.channelManagementService.getToken(ipRequest);
        await this.channelManagementService.wtf();
        return '';
    }

    @Get("/genres/all")
    public async getAllGenres() {

        return await this.channelManagementService.getAllGenres();
    }

    @Get("/channel/:id")
    public async getChannelsByGenre(@Param() param) {

        return await this.channelManagementService.getChannelsByGenre(param.id);
    }

    @Get("/all")
    public async getAllChannels() {

        return await this.channelManagementService.getAllChannelsMinistra();
    }

    @Get("/image")
    public async getImageMinistra(@Query() query, @Res() response) {
        // return await this.channelManagementService.getImage(query.imgName, query.channelId);
        // const data = await this.channelManagementService.getImage(query.imgName, query.channelId);
        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = tokenRes.data.js.token;
        const random:string = tokenRes.data.js.random;

        const responseImage = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/misc/logos/${query.channelId}/${query.imgName}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
            responseType:"arraybuffer"
        })
        response.setHeader('Content-Type', 'image/gif');
        response.send(responseImage.data)
    }

    @Get("/getSchedule:id")
    public async getSchedule(@Param() par, @Req() req) {
        const { date } = req.query;
        const channelId = par.id;
        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token = tokenRes.data.js.token;
        const random = tokenRes.data.js.random;

        const response = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=epg&action=get_simple_data_table&ch_id=${channelId}&date=${date}&p=1&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        });

        const pages = Math.ceil(response.data["js"]["total_items"] / response.data["js"]["max_page_items"]);
        console.log(pages);
        const mergedData = [response.data["js"]["data"]];
        console.log(mergedData);

        for (let i = 1; i < pages; i++) {
            const pageResponse = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=epg&action=get_simple_data_table&ch_id=${channelId}&date=${date}&p=${i}&JsHttpRequest=1-xml`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
                },
            });
            mergedData.push(pageResponse.data["js"]["data"]);
        }

        return mergedData.flat();
    }



    @Get("/timecode")
    public async timecode(@Req() req) {
        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = tokenRes.data.js.token;
        const random:string = tokenRes.data.js.random;
        const {archiveId} = req.query
        const response = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=tv_archive&action=create_link&cmd=auto%20/media/${archiveId}.mpg&series=&forced_storage=&disable_ad=0&download=0&force_ch_link_check=0&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        })

        return response.data.js.cmd
    }


}
