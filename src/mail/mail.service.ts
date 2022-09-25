import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Mailgun from 'mailgun-js'

@Injectable()
export class MailService {
    private mg: Mailgun.Mailgun
    constructor(
        private configService: ConfigService
    ) {
        this.mg = Mailgun({
            apiKey: this.configService.get('PRIVATE_API_KEY_MAILGUN'),
            domain: this.configService.get('MAILGUN_SENDING_DOMAIN')
        })
    }
    async sendActivationEmail(email, activationLink): Promise<Mailgun.messages.SendResponse> {

        await this.mg.messages().send({
            from: this.configService.get('JS_CODE_MAIL'),
            to: email,
            subject: 'Шалом жидяра, підтверди свою дрисню , ну тіпа пошту',
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
                <p>Confirm email</p>
                <button>
                    <a href="${this.configService.get('DOMAIN')}/api/activate/${activationLink}">Confirm</a>
                </button>
            </body>
            </html>`
        }, function (error, body) {
            if (error) {
                console.log(error);
            }
            console.log(body);
        })
    }
}