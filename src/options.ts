export interface IServiceOptions {
    // id to easy retrieve later without all the options
    id: string;
    // aws region
    region: string;
    endpoint?: (service: SERVICE_NAME, userProvideId: string) => string;
}

export enum SERVICE_NAME {
    DYN = 'dyn',
    FIREHOSE = 'firehose',
    S3 = 's3',
    SQS = 'sqs',
    SSM = 'ssm',
}