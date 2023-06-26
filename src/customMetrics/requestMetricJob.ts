import {Injectable} from "@nestjs/common";
import {RequestMetricsService} from "./requestMetrics.service";
import {Cron} from "@nestjs/schedule";


@Injectable()
export class RequestMetricJob {
    constructor(
        private readonly requestMetricsService: RequestMetricsService
    ) {
    }

    @Cron('0 * * * * *')
    resetRequestCounter() {
        this.requestMetricsService.resetRequestCount()
    }
}