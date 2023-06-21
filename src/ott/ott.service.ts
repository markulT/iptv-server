import {Injectable} from '@nestjs/common';
import axios from "axios";

interface MinistraTokens {
    token:string,
    random:string
}

@Injectable()
export class OttService
{
    async getStreamUrl(id:string) {

        const {token, random} = await this.getTokens()

        const streamUrl = await axios.get(`http://a7777.top/stalker_portal/server/load.php?type=itv&action=create_link&cmd=ffmpeg%20http://localhost/ch/${id}&series=&forced_storage=undefined&disable_ad=0&download=0&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=43175a1409edce30dbcf6aa2bb8b182f`
            }
        })
        const regex = /\/([a-zA-Z0-9_-]+)\/mono\.m3u8/;
        const match = streamUrl.data.js.cmd.match(regex)
        // console.log(streamUrl.data.js.cmd)
        const realName = match ? match[1] : null

        return realName;
    }

    async getArchiveUrl(id:string) {
        const {token, random} = await this.getTokens()

        const archiveResponse = await axios.get(`https://${process.env.MINISTRA_PORTAL}/stalker_portal/server/load.php?type=tv_archive&action=create_link&cmd=auto%20/media/${id}.mpg&series=&forced_storage=&disable_ad=0&download=0&force_ch_link_check=0&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        }).then(res=>res.data)

        return archiveResponse.js.cmd
    }

    async getAllMovies() {
        const {token, random} = await this.getTokens()

        const allMoviesResponse = await axios.get(`https://${process.env.MINISTRA_PORTAL}stalker_portal/server/load.php?type=vod&action=get_ordered_list&movie_id=0&season_id=0&episode_id=0&row=0&category=*&fav=0&sortby=added&hd=0&not_ended=0&p=1&JsHttpRequest=1-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': `mac=00:1A:79:51:AB:E0; mac_emu=1; debug=1; debug_key=${process.env.MINISTRA_DEBUG_KEY}`
            },
        }).then(res=>res.data)

        return allMoviesResponse
    }

    async getRealName(url:string):Promise<string> {
        const regex = /\/([a-zA-Z0-9]+)\/archive/;
        const match = url.match(regex)
        const extractedString = match ? match[1] : '';
        return extractedString
    }

    async parseTokenFromUrl(url:string):Promise<string> {
        const regex = /token=([^&]+)/;
        const match = url.match(regex)
        const token = match ? match[1] : '';
        return token
    }

    async replaceToken(url:string, newToken:string):Promise<string> {
        const regex = /token=([^&]+)/;
        return url.replace(regex, `token=${newToken}`);
    }

    async replaceDomain(url:string, newDomain:string):Promise<string> {
        const regex = /^(http:\/\/)([^:/]+)(:\d+)/;
        return url.replace(regex, `$1${newDomain}$3`)
    }

    async getTokens():Promise<MinistraTokens> {
        const response = await axios.get(`http://a7777.top/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);


        const token:string = response.data.js.token;
        const random:string = response.data.js.random;
        return {token:token, random:random}
    }
}
