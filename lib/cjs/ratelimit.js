"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PtRateLimter = void 0;
const limiter_1 = require("limiter");
const logger_1 = require("./logger");
class PtRateLimter {
    constructor(maxUnits, timeUnit) {
        this.maxUnits = maxUnits;
        this.base = new limiter_1.RateLimiter(maxUnits, timeUnit);
        this.requests = new Array();
        this.curRequest = null;
    }
    removeTokens(num) {
        if (this.requests.length > 0) {
            return new Promise((resolve, reject) => {
                this.requests.push({ num, cb: resolve });
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
            this.requests.push({ num, cb: resolve });
            this.processRequestsInOrder();
        });
    }
    processRequestsInOrder() {
        if (this.curRequest !== null) {
            return;
        }
        if (this.requests.length === 0) {
            return;
        }
        this.iterateOnRequest();
    }
    iterateOnRequest() {
        (0, logger_1.log)('iterateOnRequest', this.requests[0].num);
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
exports.PtRateLimter = PtRateLimter;
