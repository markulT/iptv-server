import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Channel, ChannelDocument} from "./channelManagement.schema";
import {Model} from "mongoose";
import {ChannelPropEnum} from "../dtos/channel.dto";
// const Binary = require("mongodb").Binary
import {Binary} from 'mongodb'
import axios from "axios";

interface Genre {
    title:string,
    id:string
}

@Injectable()
export class ChannelManagementService {

    private instance = axios.create({
        baseURL:'',
        withCredentials:true
    })

    constructor(
        @InjectModel(Channel.name) private readonly channelModel:Model<ChannelDocument>
    ) {
    }
    async getAll():Promise<Array<Channel>> {
        const channels = await this.channelModel.find()
        return channels
    }
    async create(name:string, title:string,description:string, imgData, imgName:string):Promise<Channel> {
        console.log(imgData)
        const channel = await this.channelModel.create({name:name,title:title,description:description, imgData:imgData,imgName:imgName})
        return channel
    }
    async delete(id):Promise<Channel> {
        const deledetChannel = await this.channelModel.findByIdAndDelete(id)
        return deledetChannel
    }
    async findChannel(name:string):Promise<Channel> {
        const channel = await this.channelModel.findOne({name:name})
        return channel
    }
    async update(id, field: keyof Channel,value):Promise<string> {
        const channel = await this.channelModel.findById(id)
        channel[field] = value
        await channel.save()
        return "Success"
    }

    async getPage(id,pageSize:number):Promise<Array<Channel>> {
        if (id==1) {
            return await this.channelModel.find().limit(pageSize)
        }
        const page = await this.channelModel.find().skip((id-1) * pageSize).limit(pageSize)
        return page
    }

    async findChannelById(id):Promise<Channel> {
        const channel = await this.channelModel.findById(id)
        return channel
    }
    async editImage(id,imgData, imgName) {
        const binImage = new Binary(imgData)
        const channel = await this.channelModel.findById(id)
        channel.imgData = binImage
        channel.imgName = imgName
        await channel.save()
    }
    async getLength() {
        const length = await this.channelModel.count()
        return length
    }

    async getToken(ipRequest:string) {

        const response = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;
        const random:string = response.data.js.random;
        const responseChannels = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })

        const channelList = responseChannels.data.js.data;
        console.log(channelList[1])
        let getUrl = `http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=create_link&cmd=${channelList[1].cmds[0].url.replace(' ', '%20')}&disable_ad=0&download=0&JsHttpRequest=1-xml`
        console.log(getUrl);
        const url = await axios.get(getUrl, {
            headers: {
                'Authorization':`Bearer ${token}`,
                'Cookie':`mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })
        console.log(url.data.js.cmd)



        // console.log(channelList)

        return null;
    }

    async wtf() {
        const response = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;
        const random:string = response.data.js.random;
        // http://a7777.top/stalker_portal/server/load.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml
        // http://a7777.top/stalker_portal/server/load.php?type=itv&action=get_ordered_list&JsHttpRequest=1-xml
        const responseGenres = await axios.get(`http://MINISTRA_DEBUG_KEY/stalker_portal/server/load.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })
        console.log(responseGenres.data.js)
    }

    async getAllGenres() {
        const response = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;
        const random:string = response.data.js.random;
        // http://a7777.top/stalker_portal/server/load.php?type=itv&action=get_genres&JsHttpRequest=1-xml
        const responseGenres = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=get_genres&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })
        return responseGenres.data.js.map(genre=>{return {title:genre.title, id:genre.id}});
    }

    async getAllChannelsMinistra() {
        console.log('b')
        const response = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;
        const random:string = response.data.js.random;
        const responseChannels = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=get_all_channels&sortby=number&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })

        return responseChannels.data.js.data;
    }

    async getChannelsByGenre(genreId:string) {
        const response = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;

        const responseChannels = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=get_ordered_list&genre=${genreId}&force_ch_link_check=&fav=0&sortby=number&hd=0&p=1&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })

        const pages = Math.ceil(parseInt(responseChannels.data["js"]["total_items"]) / responseChannels.data["js"]["max_page_items"]);
        console.log(pages);
        const mergedData = [responseChannels.data["js"]["data"]];
        console.log(mergedData);

        for (let i = 2; i <= pages; i++) {
            console.log()
            const pageResponse = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=get_ordered_list&genre=${genreId}&force_ch_link_check=&fav=0&sortby=number&hd=0&p=${i}&JsHttpRequest=1-xml`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
                },
            });
            console.log(`iterations${i}`)
            mergedData.push(pageResponse.data["js"]["data"]);
        }

        return mergedData.flat();

    }
    async getAllChannelsFlex(mac:string) {
        console.log(mac)
        console.log('b')
        const response = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;
        const random:string = response.data.js.random;
        const responseChannels = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=get_all_channels&sortby=number&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=${mac}; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })

        return responseChannels.data.js.data;
    }

    async getChannelsByGenreFlex(genreId:string, mac:string) {
        console.log(mac  + 'mac')
        const response = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;
        const random:string = response.data.js.random;

        const responseChannels = await axios.get(` https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=get_ordered_list&genre=${genreId}&force_ch_link_check=&fav=0&sortby=number&hd=0&p=0&JsHttpRequest=1-xml`, {

            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00%3A1A%3A79%3A32%3A76%3A79; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })
        console.log("response")
        console.log(responseChannels.data)

        const pages = Math.ceil(parseInt(responseChannels.data["js"]["total_items"]) / responseChannels.data["js"]["max_page_items"]);
        console.log(pages);
        const mergedData = [responseChannels.data["js"]["data"]];
        console.log(mergedData);

        for (let i = 2; i <= pages; i++) {
            console.log()
            const pageResponse = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=itv&action=get_ordered_list&genre=${genreId}&force_ch_link_check=&fav=0&sortby=number&hd=0&p=${i}&JsHttpRequest=1-xml`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
                },
            });
            console.log(`iterations${i}`)
            mergedData.push(pageResponse.data["js"]["data"]);
        }

        return mergedData.flat();

    }

    async getImage(imgName:string, channelId:string) {
        const response = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;
        const random:string = response.data.js.random;
        const url = `http://${process.env.MINISTRA_PORTAL}/stalker_portal/misc/logos/${channelId}/${imgName}`
        const responseImage = await axios.get(`http://${process.env.MINISTRA_PORTAL}/stalker_portal/misc/logos/${channelId}/${imgName}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            }
        })
        // ab
        return responseImage.data

    }
}
