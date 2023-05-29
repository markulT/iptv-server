import { Injectable } from '@nestjs/common';
import axios from "axios";

@Injectable()
export class OttService
{
    async getStreamUrl(id:string) {

        const response = await axios.get(`http://a7777.top/stalker_portal/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`);

        const token:string = response.data.js.token;
        const random:string = response.data.js.random;

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
}
