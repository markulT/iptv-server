import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  getHello(): string {
    return process.env.PRIVATE_API_KEY_MAILGUN;
  }
}
