import { Injectable, NestMiddleware } from "@nestjs/common";


@Injectable()
export class errorMiddleware implements NestMiddleware {
    use(req: any, res: any, next: (error?: any) => void) {
        try {


        } catch (error) {

        }
    }
}