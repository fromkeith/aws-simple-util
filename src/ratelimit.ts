
import {
    Interval,
    RateLimiter,
    RemoveTokensCallback,
} from 'limiter';
import {log} from './logger';

interface IRequestItem {
    num: number;
    cb: () => any;
}
export class PtRateLimter {
    private base: RateLimiter;
    private requests: IRequestItem[];
    private curRequest: number | null;
    constructor(private maxUnits: number, timeUnit: string) {
        this.base = new RateLimiter(maxUnits, timeUnit as Interval);
        this.requests = new Array<IRequestItem>();
        this.curRequest = null;
    }
    public removeTokens(num: number): Promise<void> {
        if (this.requests.length > 0) {
            return new Promise((resolve, reject) => {
                this.requests.push({num, cb: resolve});
            });
        }
        if (num <= this.maxUnits) {
            return new Promise((resolve, reject) => {
                this.base.removeTokens(num, () => {
                    resolve();
                });
            });
        }
        return new Promise((resolve, reject) => {
            this.requests.push({num, cb: resolve});
            this.processRequestsInOrder();
        });
    }
    private processRequestsInOrder() {
        if (this.curRequest !== null) {
            return;
        }
        if (this.requests.length === 0) {
            return;
        }
        this.iterateOnRequest();
    }
    private iterateOnRequest() {
        log('iterateOnRequest', this.requests[0].num);
        this.curRequest = this.requests[0].num;
        const removed = Math.max(0, Math.min(this.maxUnits, this.curRequest));
        this.base.removeTokens(removed, () => {
            this.requests[0].num -= removed;
            if (this.requests[0].num <= 0) {
                this.requests[0].cb();
                this.curRequest = null;
                this.requests.shift();
                this.processRequestsInOrder();
                return;
            }
            setTimeout(() => {
                this.iterateOnRequest();
            }, 0);
        });
    }
}

