import * as aws from 'aws-sdk';
import { IServiceOptions } from './options';
export declare class S3 {
    private s3;
    constructor(opt: IServiceOptions);
    createMultipartUpload(params: aws.S3.CreateMultipartUploadRequest): Promise<aws.S3.CreateMultipartUploadOutput>;
    completeMultipartUpload(params: aws.S3.CompleteMultipartUploadRequest): Promise<aws.S3.CompleteMultipartUploadOutput>;
    uploadPart(params: aws.S3.UploadPartRequest): Promise<aws.S3.UploadPartOutput>;
    headObject(params: aws.S3.HeadObjectRequest): Promise<aws.S3.HeadObjectOutput>;
    getObject(params: aws.S3.GetObjectRequest): Promise<aws.S3.GetObjectOutput>;
    listBucket(params: aws.S3.ListObjectsV2Request): Promise<aws.S3.ListObjectsV2Output>;
    deleteObjects(params: aws.S3.DeleteObjectsRequest): Promise<aws.S3.DeleteObjectsOutput>;
}
