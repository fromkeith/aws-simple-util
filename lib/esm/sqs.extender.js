export class VisibilityExtender {
    constructor(sqs, defaultVisibilitySeconds, extendBy) {
        this.sqs = sqs;
        this.defaultVisibilitySeconds = defaultVisibilitySeconds;
        this.extendBy = extendBy;
        this.monitoring = [];
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
        return expiresAt - Math.min(this.extendBy, 10 * 1000);
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
            this.currentTimeout = setTimeout(() => {
                this.extend();
            }, Date.now() - this.nextTimeoutAtMs);
        }
    }
    extend() {
        this.nextTimeoutAtMs = 0;
        const now = Date.now();
        for (let i = 0; i < this.monitoring.length; i++) {
            if (this.monitoring[i].extendAt > now) {
                break;
            }
            try {
                this.sqs.changeMessageVisibility(this.monitoring[i].msg, this.extendBy);
            }
            catch (ex) {
                // ignore errors
            }
            const extendedTo = Date.now() + this.extendBy;
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
