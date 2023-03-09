"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Firehose = void 0;
const aws = __importStar(require("aws-sdk"));
const sleep_1 = require("./sleep");
const options_1 = require("./options");
class Firehose {
    constructor(opt) {
        this.firehose = new aws.Firehose({
            region: opt.region,
            endpoint: opt.endpoint(options_1.SERVICE_NAME.FIREHOSE, opt.id),
            credentials: opt.credentials(options_1.SERVICE_NAME.FIREHOSE, opt.id),
        });
    }
    pushToFirehose(streamName, records) {
        if (records.length === 0) {
            return Promise.resolve();
        }
        if (records.length > 500) {
            return Promise.all([
                this.pushToFirehose(streamName, records.slice(0, records.length / 2)),
                this.pushToFirehose(streamName, records.slice(records.length / 2)),
            ]).then(() => {
                // void
            });
        }
        if (Buffer.from(JSON.stringify(records)).length > 4 * 1024 * 1024) {
            return Promise.all([
                this.pushToFirehose(streamName, records.slice(0, records.length / 2)),
                this.pushToFirehose(streamName, records.slice(records.length / 2)),
            ]).then(() => {
                // void
            });
        }
        return new Promise((resolve, reject) => {
            this.firehose.putRecordBatch({
                DeliveryStreamName: streamName,
                Records: records.map((item) => {
                    return { Data: JSON.stringify(item) + '\n' };
                }),
            }, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then(async (resp) => {
            if (resp.FailedPutCount > 0) {
                let retry = [];
                for (let i = 0; i < resp.RequestResponses.length; i++) {
                    const failed = resp.RequestResponses[i];
                    if (failed.ErrorCode === 'ServiceUnavailableException') {
                        retry.push(records[i]);
                    }
                }
                if (retry.length > 0) {
                    await (0, sleep_1.sleep)(100 * retry.length);
                    return this.pushToFirehose(streamName, retry);
                }
            }
        });
    }
}
exports.Firehose = Firehose;
