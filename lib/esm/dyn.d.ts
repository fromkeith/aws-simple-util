import * as aws from 'aws-sdk';
import { IServiceOptions } from './options';
export interface IQueryResult<T> {
    next: any;
    items: T[];
    count: number;
}
export declare enum CACHE_ACTION {
    READ = "read",
    WRITE = "write"
}
export declare class DynamoDB {
    private dyn;
    private rateLimiting;
    constructor(opt: IServiceOptions);
    setRateLimit(tableName: string, action: CACHE_ACTION, limit: number): void;
    private getRateLimiter;
    updateItem<T>(updateInput: aws.DynamoDB.UpdateItemInput, skipPreThrottle?: boolean): Promise<T>;
    putItem<T>(putItemInput: aws.DynamoDB.PutItemInput, skipPreThrottle?: boolean): Promise<T>;
    getItem<T>(getInput: aws.DynamoDB.GetItemInput, skipPreThrottle?: boolean): Promise<T>;
    queryTable<T>(queryInput: aws.DynamoDB.QueryInput, next?: any, skipPreThrottle?: boolean): Promise<IQueryResult<T>>;
    scanTable<T>(queryInput: aws.DynamoDB.ScanInput, next?: any): Promise<IQueryResult<T>>;
    batchGet<T>(batchInput: aws.DynamoDB.BatchGetItemInput, skipPreThrottle?: boolean): Promise<T[]>;
    batchWrite(batchInput: aws.DynamoDB.BatchWriteItemInput, skipPreThrottle?: boolean): Promise<void>;
}
