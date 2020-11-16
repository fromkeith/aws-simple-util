import * as aws from 'aws-sdk';
export interface IQueryResult<T> {
    next: any;
    items: T[];
}
export declare class DynamoDB {
    private dyn;
    private rateLimiting;
    constructor(region: string);
    private getRateLimiter;
    updateItem<T>(updateInput: aws.DynamoDB.UpdateItemInput, skipPreThrottle?: boolean): Promise<T>;
    getItem<T>(getInput: aws.DynamoDB.GetItemInput, skipPreThrottle?: boolean): Promise<T>;
    queryTable<T>(queryInput: aws.DynamoDB.QueryInput, next?: any, skipPreThrottle?: boolean): Promise<IQueryResult<T>>;
    scanTable<T>(queryInput: aws.DynamoDB.ScanInput, next?: any): Promise<IQueryResult<T>>;
    batchGet<T>(batchInput: aws.DynamoDB.BatchGetItemInput, skipPreThrottle?: boolean): Promise<T[]>;
}
