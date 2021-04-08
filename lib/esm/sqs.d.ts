import * as aws from 'aws-sdk';
import { IServiceOptions } from './options';
export interface ISqsMessage<T> {
    handle: string;
    queue: string;
    msg: T;
}
export declare class Sqs {
    private sqs;
    constructor(opt: IServiceOptions);
    getMessage<T>(config: Map<string, string>): Promise<ISqsMessage<T>>;
    getMessageFrom<T>(params: AWS.SQS.ReceiveMessageRequest): Promise<ISqsMessage<T>>;
    getMessageRaw(config: Map<string, string>): Promise<ISqsMessage<string>>;
    getMessageRawFrom(params: AWS.SQS.ReceiveMessageRequest): Promise<ISqsMessage<string>>;
    deleteMessage<T>(config: Map<string, string>, msg: ISqsMessage<T>): Promise<void>;
    deleteMessageAlt<T>(msg: ISqsMessage<T>): Promise<void>;
    deleteMessageFrom<T>(queueUrl: string, msg: ISqsMessage<T>): Promise<void>;
    batchGetMessages<T>(config: Map<string, string>): Promise<ISqsMessage<T>[]>;
    batchGetMessagesFrom<T>(params: aws.SQS.ReceiveMessageRequest): Promise<ISqsMessage<T>[]>;
    batchDeleteMessages<T>(config: Map<string, string>, msgs: ISqsMessage<T>[]): Promise<void>;
    sendMessage<T>(config: Map<string, string>, message: T): Promise<void>;
    sendMessageTo<T>(queueUrl: string, message: T): Promise<void>;
    batchSendMessageToRaw(queueUrl: string, entries: aws.SQS.SendMessageBatchRequestEntryList): Promise<void>;
    batchSendMessageTo<T>(queueUrl: string, msgs: T[]): Promise<void>;
    batchSendMessage<T>(config: Map<string, string>, msgs: T[]): Promise<void>;
    changeMessageVisibility<T>(msg: ISqsMessage<T>, timeoutSecondsFromNow: number): Promise<void>;
}
