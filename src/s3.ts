import * as aws from 'aws-sdk';
import {IServiceOptions, SERVICE_NAME} from './options';



export class S3 {

    private s3: aws.S3;
    constructor(opt: IServiceOptions) {
        this.s3 = new aws.S3({
            region: opt.region,
            endpoint: opt.endpoint(SERVICE_NAME.S3, opt.id),
        });
    }

    public createMultipartUpload(params: aws.S3.CreateMultipartUploadRequest): Promise<aws.S3.CreateMultipartUploadOutput> {
        return this.s3.createMultipartUpload(params).promise();
    }

    public completeMultipartUpload(params: aws.S3.CompleteMultipartUploadRequest): Promise<aws.S3.CompleteMultipartUploadOutput> {
        return this.s3.completeMultipartUpload(params).promise();
    }
    public uploadPart(params: aws.S3.UploadPartRequest): Promise<aws.S3.UploadPartOutput> {
        return this.s3.uploadPart(params).promise();
    }


    public headObject(params: aws.S3.HeadObjectRequest): Promise<aws.S3.HeadObjectOutput> {
        return this.s3.headObject(params).promise();
    }
    public putObject(params: aws.S3.PutObjectRequest): Promise<aws.S3.PutObjectOutput> {
        return this.s3.putObject(params).promise();
    }
    public getObject(params: aws.S3.GetObjectRequest): Promise<aws.S3.GetObjectOutput> {
        return this.s3.getObject(params).promise();
    }
    public listBucket(params: aws.S3.ListObjectsV2Request): Promise<aws.S3.ListObjectsV2Output> {
        return this.s3.listObjectsV2(params).promise();
    }

    public async deleteObjects(params: aws.S3.DeleteObjectsRequest): Promise<aws.S3.DeleteObjectsOutput> {
        if (params.Delete.Objects.length < 0) {
            return Promise.resolve({});
        }
        if (params.Delete.Objects.length > 1000) {
            const copy: aws.S3.DeleteObjectsRequest = JSON.parse(JSON.stringify(params));
            delete copy.Delete.Objects;
            let results = new Array<aws.S3.DeleteObjectsOutput>();
            for (let i = 0; i < params.Delete.Objects.length; i+=1000) {
                copy.Delete.Objects = params.Delete.Objects.slice(i, i + 1000);
                results = results.concat(await this.deleteObjects(copy));
            }
            const response = results[0];
            for (let i = 1; i < results.length; i++) {
                if (response.Deleted) {
                    response.Deleted = response.Deleted.concat(results[i].Deleted);
                } else {
                    response.Deleted = results[i].Deleted
                }
                if (response.Errors) {
                    response.Errors = response.Errors.concat(results[i].Errors);
                } else {
                    response.Errors = results[i].Errors
                }
            }
            return response;
        }
        return new Promise((resolve, reject) => {
            this.s3.deleteObjects(params, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        })
    }
}