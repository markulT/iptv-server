import { Controller, Post } from '@nestjs/common';
import {KalturaService} from "./kaltura.service";
// import kaltura from 'kaltura-client'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const kaltura = require('kaltura-client')

@Controller('kaltura')
export class KalturaController {

    constructor(
        private kalturaService:KalturaService
    ) {

    }

    private config = new kaltura.Configuration();
    private client = new kaltura.Client(this.config);

    @Post('/')
    async test()
    {
        kaltura.services.session.start(
            "98e8e0f4fca242aacf2f9d2dcf98a38d",
            "marrcokyr@gmail.com",
            kaltura.enums.SessionType.ADMIN,
            4831482,
            7159643,
            'zalupaId:iptvParasha-iptvParasha'
        ).completion((success,ks)=>{
            console.log(success)
            console.log('parasha')
            console.log(ks)
            this.client.setKs(ks)
        })
    }
}
