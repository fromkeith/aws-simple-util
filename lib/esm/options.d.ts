export interface IServiceOptions {
    id: string;
    region: string;
    endpoint?: (service: SERVICE_NAME, userProvideId: string) => string;
}
export declare enum SERVICE_NAME {
    DYN = "dyn",
    FIREHOSE = "firehose",
    S3 = "s3",
    SQS = "sqs",
    SSM = "ssm"
}
