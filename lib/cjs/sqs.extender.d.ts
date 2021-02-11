import { ISqsMessage, Sqs } from './sqs';
export declare class VisibilityExtender {
    private sqs;
    private defaultVisibilitySeconds;
    private extendBySeconds;
    private monitoring;
    private nextTimeoutAtMs;
    private currentTimeout;
    constructor(sqs: Sqs, defaultVisibilitySeconds: number, extendBySeconds: number);
    monitor(msg: ISqsMessage<any>): void;
    private calcExtendAt;
    private sort;
    private resetTimeout;
    private extend;
    release(msg: ISqsMessage<any>): void;
}
