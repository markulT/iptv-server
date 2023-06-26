import {Injectable, NestMiddleware} from "@nestjs/common";
import {RequestMetricsService} from "./requestMetrics.service";


@Injectable()
export class RequestMetricMiddleware implements NestMiddleware {

    constructor(
        private requestMetricService:RequestMetricsService
    ) {
    }

    use(req: any, res: any, next: (error?: any) => void) {
        this.requestMetricService.incrementRequestCount();
        next()
    }
}