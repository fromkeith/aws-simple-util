import * as aws from 'aws-sdk';
import { IServiceOptions } from './options';
export declare class S3 {
    private s3;
    constructor(opt: IServiceOptions);
    copyObject(params: aws.S3.CopyObjectRequest): Promise<aws.S3.CopyObjectOutput>;
    listObjectVersions(params: aws.S3.ListObjectVersionsRequest): Promise<aws.S3.ListObjectVersionsOutput>;
    createMultipartUpload(params: aws.S3.CreateMultipartUploadRequest): Promise<aws.S3.CreateMultipartUploadOutput>;
    completeMultipartUpload(params: aws.S3.CompleteMultipartUploadRequest): Promise<aws.S3.CompleteMultipartUploadOutput>;
    uploadPart(params: aws.S3.UploadPartRequest): Promise<aws.S3.UploadPartOutput>;
    headObject(params: aws.S3.HeadObjectRequest): Promise<aws.S3.HeadObjectOutput>;
    putObject(params: aws.S3.PutObjectRequest): Promise<aws.S3.PutObjectOutput>;
    getObject(params: aws.S3.GetObjectRequest): Promise<aws.S3.GetObjectOutput>;
    listBucket(params: aws.S3.ListObjectsV2Request): Promise<aws.S3.ListObjectsV2Output>;
    deleteObjects(params: aws.S3.DeleteObjectsRequest): Promise<aws.S3.DeleteObjectsOutput>;
}
