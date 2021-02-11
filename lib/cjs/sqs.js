"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.Sqs = void 0;
const aws = __importStar(require("aws-sdk"));
const options_1 = require("./options");
class Sqs {
    constructor(opt) {
        this.sqs = new aws.SQS({
            region: opt.region,
            endpoint: opt.endpoint(options_1.SERVICE_NAME.SQS, opt.id),
            credentials: opt.credentials(options_1.SERVICE_NAME.SQS, opt.id),
        });
    }
    getMessage(config) {
        return this.getMessageFrom({
            QueueUrl: config.get('ReceiveTaskQueue'),
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
        });
    }
    getMessageFrom(params) {
        return this.getMessageRawFrom(params)
            .then((result) => {
            if (result === null) {
                return null;
            }
            return {
                msg: JSON.parse(result.msg),
                handle: result.handle,
                queue: params.QueueUrl,
            };
        });
    }
    getMessageRaw(config) {
        return this.getMessageRawFrom({
            QueueUrl: config.get('ReceiveTaskQueue'),
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
        });
    }
    getMessageRawFrom(params) {
        return new Promise((resolve, reject) => {
            this.sqs.receiveMessage(params, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then((resp) => {
            if (!resp || !resp.Messages || resp.Messages.length === 0) {
                return null;
            }
            return {
                msg: resp.Messages[0].Body,
                handle: resp.Messages[0].ReceiptHandle,
                queue: params.QueueUrl,
            };
        });
    }
    deleteMessage(config, msg) {
        return this.deleteMessageFrom(config.get('ReceiveTaskQueue'), msg);
    }
    deleteMessageAlt(msg) {
        return this.deleteMessageFrom(msg.queue, msg);
    }
    deleteMessageFrom(queueUrl, msg) {
        return new Promise((resolve) => {
            this.sqs.deleteMessage({
                ReceiptHandle: msg.handle,
                QueueUrl: queueUrl,
            }, (err) => {
                if (err) {
                    console.log('ERROR deleting message!', err);
                }
                resolve();
            });
        });
    }
    batchGetMessages(config) {
        return this.batchGetMessagesFrom({
            QueueUrl: config.get('ReceiveTaskQueue'),
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
        });
    }
    batchGetMessagesFrom(params) {
        return new Promise((resolve, reject) => {
            this.sqs.receiveMessage(params, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then((resp) => {
            if (!resp || !resp.Messages || resp.Messages.length === 0) {
                return [];
            }
            return resp.Messages.map((a) => {
                return {
                    msg: JSON.parse(a.Body),
                    handle: a.ReceiptHandle,
                    queue: params.QueueUrl,
                };
            });
        });
    }
    batchDeleteMessages(config, msgs) {
        if (msgs.length === 0) {
            return Promise.resolve();
        }
        if (msgs.length > 10) {
            const wait = new Array();
            for (let i = 0; i < msgs.length; i += 10) {
                wait.push(this.batchDeleteMessages(config, msgs.slice(i, i + 10)));
            }
            return Promise.all(wait).then(() => {
                return; //void
            });
        }
        return new Promise((resolve) => {
            this.sqs.deleteMessageBatch({
                Entries: msgs.map((m, i) => {
                    return {
                        Id: String(i),
                        ReceiptHandle: m.handle,
                    };
                }),
                QueueUrl: config.get('ReceiveTaskQueue'),
            }, (err) => {
                if (err) {
                    console.log('ERROR deleting message!', err);
                }
                resolve();
            });
        });
    }
    sendMessage(config, message) {
        return new Promise((resolve, reject) => {
            this.sqs.sendMessage({
                QueueUrl: config.get('SendTaskQueue'),
                MessageBody: JSON.stringify(message),
            }, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then((resp) => {
            return; // void
        });
    }
    batchSendMessageToRaw(queueUrl, entries) {
        if (entries.length === 0) {
            return Promise.resolve();
        }
        if (entries.length > 10) {
            const wait = new Array();
            for (let i = 0; i < entries.length; i += 10) {
                wait.push(this.batchSendMessageToRaw(queueUrl, entries.slice(i, i + 10)));
            }
            return Promise.all(wait).then(() => {
                return; //void
            });
        }
        return new Promise((resolve, reject) => {
            this.sqs.sendMessageBatch({
                QueueUrl: queueUrl,
                Entries: entries,
            }, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then((resp) => {
            return; // void
        });
    }
    batchSendMessageTo(queueUrl, msgs) {
        return this.batchSendMessageToRaw(queueUrl, msgs.map((m, i) => {
            return {
                Id: String(i),
                MessageBody: JSON.stringify(m),
            };
        }));
    }
    batchSendMessage(config, msgs) {
        return this.batchSendMessageTo(config.get('SendTaskQueue'), msgs);
    }
    changeMessageVisibility(msg, timeoutSecondsFromNow) {
        return this.sqs.changeMessageVisibility({
            QueueUrl: msg.queue,
            ReceiptHandle: msg.handle,
            VisibilityTimeout: timeoutSecondsFromNow,
        }).promise()
            .then(() => {
            // void
        });
    }
}
exports.Sqs = Sqs;
