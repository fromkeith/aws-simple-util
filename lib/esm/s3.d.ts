import * as aws from 'aws-sdk';
export declare class S3 {
    private s3;
    constructor(region: string);
    headObject(params: aws.S3.HeadObjectRequest): Promise<aws.S3.HeadObjectOutput>;
    getObject(params: aws.S3.GetObjectRequest): Promise<aws.S3.GetObjectOutput>;
    listBucket(params: aws.S3.ListObjectsV2Request): Promise<aws.S3.ListObjectsV2Output>;
    deleteObjects(params: aws.S3.DeleteObjectsRequest): Promise<aws.S3.DeleteObjectsOutput>;
}
