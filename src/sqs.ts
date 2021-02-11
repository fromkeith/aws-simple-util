import * as aws from 'aws-sdk';
import {IServiceOptions, SERVICE_NAME} from './options';
import {log} from './logger';

export interface ISqsMessage<T> {
    handle: string;
    queue: string;
    msg: T;
}

export class Sqs {

    private sqs: aws.SQS;
    constructor(opt: IServiceOptions) {
        this.sqs = new aws.SQS({
            region: opt.region,
            endpoint: opt.endpoint(SERVICE_NAME.SQS, opt.id),
            credentials: opt.credentials(SERVICE_NAME.SQS, opt.id),
        });
    }

    public getMessage<T>(config: Map<string, string>): Promise<ISqsMessage<T>> {
        return this.getMessageFrom<T>({
            QueueUrl: config.get('ReceiveTaskQueue'),
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
        });
    }
    public getMessageFrom<T>(params: AWS.SQS.ReceiveMessageRequest): Promise<ISqsMessage<T>> {
        return this.getMessageRawFrom(params)
            .then((result) => {
                if (result === null) {
                    return null;
                }
                return {
                    msg: JSON.parse(result.msg) as T,
                    handle: result.handle,
                    queue: params.QueueUrl,
                };
            });
    }

    public getMessageRaw(config: Map<string, string>): Promise<ISqsMessage<string>> {
        return this.getMessageRawFrom({
            QueueUrl: config.get('ReceiveTaskQueue'),
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
        });
    }

    public getMessageRawFrom(params: AWS.SQS.ReceiveMessageRequest): Promise<ISqsMessage<string>> {
        return new Promise((resolve, reject) => {
            this.sqs.receiveMessage(params, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then((resp: aws.SQS.ReceiveMessageResult) => {
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

    public deleteMessage<T>(config: Map<string, string>, msg: ISqsMessage<T>): Promise<void> {
        return this.deleteMessageFrom<T>(config.get('ReceiveTaskQueue'), msg);
    }

    public deleteMessageAlt<T>(msg: ISqsMessage<T>): Promise<void> {
        return this.deleteMessageFrom<T>(msg.queue, msg);
    }

    public deleteMessageFrom<T>(queueUrl: string, msg: ISqsMessage<T>): Promise<void> {
        return new Promise<void>((resolve) => {
            this.sqs.deleteMessage({
                ReceiptHandle: msg.handle,
                QueueUrl: queueUrl,
            }, (err) => {
                if (err) {
                    log('ERROR deleting message!', err);
                }
                resolve();
            });
        });
    }

    public batchGetMessages<T>(config: Map<string, string>): Promise<ISqsMessage<T>[]> {
        return this.batchGetMessagesFrom({
            QueueUrl: config.get('ReceiveTaskQueue'),
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
        });
    }
    public batchGetMessagesFrom<T>(params: aws.SQS.ReceiveMessageRequest): Promise<ISqsMessage<T>[]> {
        return new Promise((resolve, reject) => {
            this.sqs.receiveMessage(params, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then((resp: aws.SQS.ReceiveMessageResult) => {
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

    public batchDeleteMessages<T>(config: Map<string, string>, msgs: ISqsMessage<T>[]): Promise<void> {
        if (msgs.length === 0) {
            return Promise.resolve();
        }
        if (msgs.length > 10) {
            const wait = new Array<Promise<void>>();
            for (let i = 0; i < msgs.length; i+=10) {
                wait.push(this.batchDeleteMessages(config, msgs.slice(i, i + 10)));
            }
            return Promise.all(wait).then(() => {
                return; //void
            });
        }
        return new Promise<void>((resolve) => {
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
                    log('ERROR deleting message!', err);
                }
                resolve();
            });
        });
    }

    public sendMessage<T>(config: Map<string, string>, message: T): Promise<void> {
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
        }).then((resp: aws.SQS.SendMessageResult) => {
            return; // void
        });
    }


    public batchSendMessageToRaw(queueUrl: string, entries: aws.SQS.SendMessageBatchRequestEntryList): Promise<void> {

        if (entries.length === 0) {
            return Promise.resolve();
        }
        if (entries.length > 10) {
            const wait = new Array<Promise<void>>();
            for (let i = 0; i < entries.length; i+=10) {
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
        }).then((resp: aws.SQS.SendMessageBatchResult) => {
            return; // void
        });
    }


    public batchSendMessageTo<T>(queueUrl: string, msgs: T[]): Promise<void> {
        return this.batchSendMessageToRaw(queueUrl, msgs.map((m, i) => {
            return {
                Id: String(i),
                MessageBody: JSON.stringify(m),
            };
        }));
    }
    public batchSendMessage<T>(config: Map<string, string>, msgs: T[]): Promise<void> {
        return this.batchSendMessageTo(config.get('SendTaskQueue'), msgs);
    }

    public changeMessageVisibility<T>(msg: ISqsMessage<T>, timeoutSecondsFromNow: number): Promise<void> {
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
