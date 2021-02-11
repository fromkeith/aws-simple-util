import {
    ISqsMessage,
    Sqs,
} from './sqs';

interface IMonitorItem {
    msg: ISqsMessage<any>;
    expiresAt: number;
    extendAt: number;
}

export class VisibilityExtender {

    private monitoring: IMonitorItem[] = [];
    private nextTimeoutAtMs: number;
    private currentTimeout: NodeJS.Timer;

    constructor(
            private sqs: Sqs,
            private defaultVisibilitySeconds: number,
            private extendBySeconds: number) {

    }

    public monitor(msg: ISqsMessage<any>) {
        this.monitoring.push({
            msg,
            expiresAt: Date.now() + this.defaultVisibilitySeconds * 1000,
            extendAt: this.calcExtendAt(Date.now() + this.defaultVisibilitySeconds * 1000),
        });
        this.sort();
    }

    private calcExtendAt(expiresAt: number): number {
        return expiresAt - Math.min(this.extendBySeconds * 1000, 10 * 1000);
    }

    private sort() {
        this.monitoring.sort((a, b) => {
            return a.extendAt - b.extendAt;
        });
        this.resetTimeout();
    }
    private resetTimeout() {
        if (this.monitoring.length === 0) {
            this.nextTimeoutAtMs = 0;
            clearTimeout(this.currentTimeout);
            return;
        }
        if (this.nextTimeoutAtMs === 0 || this.monitoring[0].extendAt < this.nextTimeoutAtMs) {
            this.nextTimeoutAtMs = this.monitoring[0].extendAt;
            clearTimeout(this.currentTimeout);
            this.currentTimeout = setTimeout(() => {
                this.extend();
            }, Date.now() - this.nextTimeoutAtMs);
        }
    }
    private extend() {
        this.nextTimeoutAtMs = 0;

        const now = Date.now();
        for (let i = 0; i < this.monitoring.length; i++) {
            if (this.monitoring[i].extendAt > now) {
                break;
            }
            try {
                this.sqs.changeMessageVisibility(this.monitoring[i].msg, this.extendBySeconds);
            } catch (ex) {
                // ignore errors
            }
            const extendedTo = Date.now() + this.extendBySeconds * 1000;
            this.monitoring[i].expiresAt = Math.max(this.monitoring[i].expiresAt, extendedTo);
            this.monitoring[i].extendAt = this.calcExtendAt(this.monitoring[i].expiresAt);
        }
        this.sort();
    }

    public release(msg: ISqsMessage<any>) {
        for (let i = 0; i < this.monitoring.length; i++) {
            if (this.monitoring[i].msg.handle === msg.handle) {
                this.monitoring.splice(i, 1);
                if (i === 0) {
                    this.resetTimeout();
                }
                return;
            }
        }
    }
}
