import * as aws from 'aws-sdk';
export interface ISqsMessage<T> {
    handle: string;
    msg: T;
}
export declare class Sqs {
    private sqs;
    constructor(region: string);
    getMessage<T>(config: Map<string, string>): Promise<ISqsMessage<T>>;
    getMessageRaw(config: Map<string, string>): Promise<ISqsMessage<string>>;
    deleteMessage<T>(config: Map<string, string>, msg: ISqsMessage<T>): Promise<void>;
    batchGetMessages<T>(config: Map<string, string>): Promise<ISqsMessage<T>[]>;
    batchDeleteMessages<T>(config: Map<string, string>, msgs: ISqsMessage<T>[]): Promise<void>;
    sendMessage<T>(config: Map<string, string>, message: T): Promise<void>;
    batchSendMessageToRaw(queueUrl: string, entries: aws.SQS.SendMessageBatchRequestEntryList): Promise<void>;
    batchSendMessageTo<T>(queueUrl: string, msgs: T[]): Promise<void>;
    batchSendMessage<T>(config: Map<string, string>, msgs: T[]): Promise<void>;
}
