import { log } from './logger';
export class VisibilityExtender {
    constructor(sqs, defaultVisibilitySeconds, extendBySeconds) {
        this.sqs = sqs;
        this.defaultVisibilitySeconds = defaultVisibilitySeconds;
        this.extendBySeconds = extendBySeconds;
        this.monitoring = [];
        this.nextTimeoutAtMs = 0;
    }
    monitor(msg) {
        this.monitoring.push({
            msg,
            expiresAt: Date.now() + this.defaultVisibilitySeconds * 1000,
            extendAt: this.calcExtendAt(Date.now() + this.defaultVisibilitySeconds * 1000),
        });
        this.sort();
    }
    calcExtendAt(expiresAt) {
        return expiresAt - Math.min(this.extendBySeconds * 1000, 10 * 1000);
    }
    sort() {
        this.monitoring.sort((a, b) => {
            return a.extendAt - b.extendAt;
        });
        this.resetTimeout();
    }
    resetTimeout() {
        if (this.monitoring.length === 0) {
            this.nextTimeoutAtMs = 0;
            clearTimeout(this.currentTimeout);
            return;
        }
        if (this.nextTimeoutAtMs === 0 || this.monitoring[0].extendAt < this.nextTimeoutAtMs) {
            this.nextTimeoutAtMs = this.monitoring[0].extendAt;
            clearTimeout(this.currentTimeout);
            log('next extend is at', {
                at: this.nextTimeoutAtMs,
            });
            this.currentTimeout = setTimeout(() => {
                this.extend();
            }, this.nextTimeoutAtMs - Date.now());
        }
    }
    extend() {
        this.nextTimeoutAtMs = 0;
        const now = Date.now();
        for (let i = 0; i < this.monitoring.length; i++) {
            if (this.monitoring[i].extendAt >= now) {
                break;
            }
            try {
                log('extending message visibility', this.monitoring[i].msg);
                this.sqs.changeMessageVisibility(this.monitoring[i].msg, this.extendBySeconds);
            }
            catch (ex) {
                log('failed to extend visibility', {
                    error: ex,
                    msg: this.monitoring[i].msg,
                });
                // ignore errors
            }
            const extendedTo = Date.now() + this.extendBySeconds * 1000;
            this.monitoring[i].expiresAt = Math.max(this.monitoring[i].expiresAt, extendedTo);
            this.monitoring[i].extendAt = this.calcExtendAt(this.monitoring[i].expiresAt);
        }
        this.sort();
    }
    release(msg) {
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
