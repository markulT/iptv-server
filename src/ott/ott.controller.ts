import {Controller, Get, HttpException, HttpStatus, Param, Query, Req, Res, MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {OttService} from "./ott.service";
import * as bcrypt from 'bcrypt'
import * as crypto from "crypto";
import {Request, Response} from "express";
import {randomBytes} from "crypto";
import axios, {Axios} from 'axios'
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {User, UserDocument} from "../users/user.schema";
import {ConfigService} from "@nestjs/config";
import * as qs from 'querystring'


function bin2hex(s){	// Convert binary data into hexadecimal representation
    //
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)

    // eslint-disable-next-line prefer-const
    let i, f = s.length, a = [];
    for(i = 0; i<f; i++){
        a[i] = s.charCodeAt(i).toString(16);
    }
    return a.join('');
}

@Controller('ott')
export class OttController {
    constructor(
        private ottService: OttService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private configService:ConfigService
    ) {
    }

    private instance = axios.create({
        baseURL:'',
        withCredentials:true
    })

    @Get('/stream')
    async getStream(@Req() req, @Res({passthrough:true}) res) {
        const userData = req.user
        const userFromDB = await this.userModel.findOne({email:userData.email})
        if(!userFromDB.mobileSubExists || !userFromDB.mobileSubOrderId) {
            throw new HttpException("Please buy a subscription first",HttpStatus.FORBIDDEN)
        }

        const {stream} = req.query
        const ipRequest = req.header('x-forwarded-for')
        const realName = await this.ottService.getStreamUrl(stream)
        console.log(`${this.configService.get<string>('OTT_SERVER')}/video.php?stream=${realName}&ipaddr=${ipRequest}`)
        const data = {
            stream:`${realName}`,
            ip:`${ipRequest}`
        }
        const formData = qs.stringify(data)
        const streamLink = await axios.post(`${this.configService.get<string>('OTT_SERVER')}/video.php`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(res=>res.data)
        console.log(streamLink)
        // ab
        return streamLink
    }

    @Get("/getAllMovies")
    public async getAllMovies(@Req() req) {
        const {page} = req.query;
        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token = tokenRes.data.js.token;
        const random = tokenRes.data.js.random;


        const response = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=vod&action=get_ordered_list&movie_id=0&season_id=0&episode_id=0&row=0&category=*&fav=0&sortby=added&hd=0&not_ended=0&p=${page}&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        });

        const mergedData = [response.data["js"]["data"]];

        const pages = Math.ceil(response.data["js"]["total_items"] / response.data["js"]["max_page_items"]);

        if(pages > page+1) {
            const pageResponse = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=vod&action=get_ordered_list&movie_id=0&season_id=0&episode_id=0&row=0&category=*&fav=0&sortby=added&hd=0&not_ended=0&p=${page+1}&JsHttpRequest=1-xml`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
                },
            });
            mergedData.push(pageResponse.data["js"]["data"]);
        }

        return mergedData.flat();

    }

    @Get("moviesByGenre/:id")
    public async moviesByGenre(@Param() param, @Req() req) {
        const {page} = req.query
        const category = param.id

        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token = tokenRes.data.js.token;
        const random = tokenRes.data.js.random;


        const response = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=vod&action=get_ordered_list&movie_id=0&season_id=0&episode_id=0&category=${category}&fav=0&sortby=added&hd=0&not_ended=0&p=${page}&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        });

        const moviesByGenreMergedData = [response.data["js"]["data"]];

        const pages = Math.ceil(response.data["js"]["total_items"] / response.data["js"]["max_page_items"]);


        if (pages > page+1) {
            const pageResponse = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=vod&action=get_ordered_list&movie_id=0&season_id=0&episode_id=0&category=${category}&fav=0&sortby=added&hd=0&not_ended=0&p=${page+1}&JsHttpRequest=1-xml`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
                },
            });
            moviesByGenreMergedData.push(pageResponse.data["js"]["data"]);
        }

        return moviesByGenreMergedData.flat();
    }

    @Get("moviesByGenreLength/:id")
    public async moviesByGenreLength(@Param() param) {
        const category = param.id

        console.log("baobab")

        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token = tokenRes.data.js.token;
        const random = tokenRes.data.js.random;

        const response = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=vod&action=get_ordered_list&movie_id=0&season_id=0&episode_id=0&category=${category}&fav=0&sortby=added&hd=0&not_ended=0&p=1&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        });


        return response.data.js.total_items;

    }

    @Get("/getAllMoviesLength")
    public async getAllMoviesLength() {
        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token = tokenRes.data.js.token;
        const random = tokenRes.data.js.random;


        const response = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=vod&action=get_ordered_list&movie_id=0&season_id=0&episode_id=0&row=0&category=*&fav=0&sortby=added&hd=0&not_ended=0&p=1&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        });


        return response.data.js.total_items;

    }

    @Get("movieGenres")
    public async movieGenres() {
        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token = tokenRes.data.js.token;
        const random = tokenRes.data.js.random;


        const response = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=vod&action=get_categories&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        });
        return response.data.js
    }

    @Get("/searchMovies")
    public async searchMovies(@Req() req) {
        // const {page} = req.query
        const search = encodeURIComponent(req.query.search);
        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token = tokenRes.data.js.token;
        const random = tokenRes.data.js.random;


        const response = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=vod&action=get_ordered_list&movie_id=0&season_id=0&episode_id=0&category=*&fav=0&sortby=added&hd=0&not_ended=0&p=1&JsHttpRequest=1-xml&abc=*&genre=*&years=*&search=${search}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        });
        return response.data.js
    }

    @Get("/image")
    public async getImageMinistra(@Query() query, @Res() response) {
        // return await this.channelManagementService.getImage(query.imgName, query.channelId);
        // const data = await this.channelManagementService.getImage(query.imgName, query.channelId);
        const tokenRes = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = tokenRes.data.js.token;
        const random:string = tokenRes.data.js.random;
        console.log(query.category + query.imgName)
        const responseImage = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/screenshots/${query.category}/${query.imgName}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
            responseType:"arraybuffer"
        })
        response.setHeader('Content-Type', 'image/gif');
        response.send(responseImage.data)
    }



    @Get("/archive")
    public async archive(@Req() req) {

        // 19
        const {stream} = req.query

        const ipRequest = req.header('x-forwarded-for')

        const archiveUrl = await this.ottService.getArchiveUrl(stream)
        const realName = await this.ottService.getRealName(archiveUrl)

        console.log(`${this.configService.get<string>('OTT_SERVER')}/video.php?stream=${realName}&ipaddr=${ipRequest}`)
        const data = {
            stream:`${realName}`,
            ip:`${ipRequest}`
        }
        const formData = qs.stringify(data)

        const archiveLink = await axios.post(`${this.configService.get<string>('OTT_SERVER')}/video.php`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(res=>res.data)
        console.log(archiveLink)

        const token = await this.ottService.parseTokenFromUrl(archiveUrl)

        const domain = 's1.mega-tv.online'

        const modifiedUrl = await this.ottService.replaceToken(archiveUrl, token)
        console.log(modifiedUrl)
        return modifiedUrl
    }





    // @Get('/stream')
    // async getStream(@Req() req: Request,@Res({passthrough:true}) res:Response) {
    //
    //     const flussonic = 'http://193.176.179.12:8880',
    //         secretKey = '1212a88787b87878c0707d07ef',
    //         streamId = 'support9',
    //         ipRequest = req.header('x-forwarded-for'),
    //         lifetime = 3600 * 3,
    //         startTime = Date.now() - 300,
    //         endTime = Date.now() + lifetime,
    //         uid = 5000,
    //         // salt = (Math.random() * 8 ** 8).toString().slice(9),
    //         salt = randomBytes(16).toString('hex'),
    //         shasum = await crypto.createHash('sha1'),
    //         urlString = streamId + ipRequest + startTime + endTime + secretKey + salt;
    //
    //     shasum.update(urlString)
    //
    //     const hash = shasum.digest('hex')
    //     const token = hash + '-' + salt + '-' + endTime + '-' + startTime
    //     const url = flussonic + '/' + streamId + '/' + 'embed.html?token=' + token + '&remote=' + ipRequest
    //     const embed =  `<iframe allowfullscreen style="width:640px; height:480px;" src="${url}"></iframe>`;
    //     res.set('X-UserId',`2000${uid}`)
    //     res.set("Location",`${url}`)
    //     res.send({url})
    // }
}


//

