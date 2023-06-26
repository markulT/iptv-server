import {Injectable} from "@nestjs/common";
import {makeCounterProvider} from "@willsoto/nestjs-prometheus";
import {Counter, register} from "prom-client";

@Injectable()
export class RequestMetricsService {
    private counter:Counter;

    constructor() {
        this.counter = new Counter({
            name:"http_request_per_minute",
            help:"Amount of http requests per minute"
        })
        register.registerMetric(this.counter)
    }

    incrementRequestCount() {
        this.counter.inc();
    }

    resetRequestCount() {
        this.counter.reset();
    }

}