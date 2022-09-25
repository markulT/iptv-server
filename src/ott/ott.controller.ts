import {Controller, Get, Req, Res} from '@nestjs/common';
import {OttService} from "./ott.service";
import * as bcrypt from 'bcrypt'
import * as crypto from "crypto";
import {Request, Response} from "express";
import {randomBytes} from "crypto";

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
        private ottService: OttService
    ) {
    }

    @Get('/stream')
    async getStream(@Req() req: Request,@Res({passthrough:true}) res:Response) {

        const flussonic = 'http://193.176.179.12:8880',
            secretKey = '1212a88787b87878c0707d07ef',
            streamId = 'support9',
            ipRequest = req.header('x-forwarded-for'),
            lifetime = 3600 * 3,
            startTime = Date.now() - 300,
            endTime = Date.now() + lifetime,
            uid = 5000,
            // salt = (Math.random() * 8 ** 8).toString().slice(9),
            salt = randomBytes(16).toString('hex'),
            shasum = await crypto.createHash('sha1'),
            urlString = streamId + ipRequest + startTime + endTime + secretKey + salt;

        shasum.update(urlString)

        const hash = shasum.digest('hex')
        const token = hash + '-' + salt + '-' + endTime + '-' + startTime
        const url = flussonic + '/' + streamId + '/' + 'embed.html?token=' + token + '&remote=' + ipRequest
        const embed =  `<iframe allowfullscreen style="width:640px; height:480px;" src="${url}"></iframe>`;
        res.set('X-UserId',`2000${uid}`)
        res.set("Location",`${url}`)
        res.send({embed,url})
    }
}



