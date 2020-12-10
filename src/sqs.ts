import * as aws from 'aws-sdk';


export interface ISqsMessage<T> {
    handle: string;
    msg: T;
}

export class Sqs {

    private sqs: aws.SQS;
    constructor(region: string) {
        this.sqs = new aws.SQS({region});
    }

    public getMessage<T>(config: Map<string, string>): Promise<ISqsMessage<T>> {
        return new Promise((resolve, reject) => {
            this.sqs.receiveMessage({
                QueueUrl: config.get('ReceiveTaskQueue'),
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20,
            } as aws.SQS.ReceiveMessageRequest, (err, resp) => {
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
                msg: JSON.parse(resp.Messages[0].Body),
                handle: resp.Messages[0].ReceiptHandle,
            };
        });
        return this.getMessageRaw(config)
            .then((result) => {
                if (result === null) {
                    return null;
                }
                return {
                    msg: JSON.parse(result.msg),
                    handle: result.handle,
                };
            });
    }

    public getMessageRaw(config: Map<string, string>): Promise<ISqsMessage<string>> {
        return new Promise((resolve, reject) => {
            this.sqs.receiveMessage({
                QueueUrl: config.get('ReceiveTaskQueue'),
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20,
            } as aws.SQS.ReceiveMessageRequest, (err, resp) => {
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
            };
        });
    }

    public deleteMessage<T>(config: Map<string, string>, msg: ISqsMessage<T>): Promise<void> {
        return new Promise<void>((resolve) => {
            this.sqs.deleteMessage({
                ReceiptHandle: msg.handle,
                QueueUrl: config.get('ReceiveTaskQueue'),
            }, (err) => {
                if (err) {
                    console.log('ERROR deleting message!', err);
                }
                resolve();
            });
        });
    }

    public batchGetMessages<T>(config: Map<string, string>): Promise<ISqsMessage<T>[]> {
        return new Promise((resolve, reject) => {
            this.sqs.receiveMessage({
                QueueUrl: config.get('ReceiveTaskQueue'),
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20,
            } as aws.SQS.ReceiveMessageRequest, (err, resp) => {
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
                    console.log('ERROR deleting message!', err);
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
}
