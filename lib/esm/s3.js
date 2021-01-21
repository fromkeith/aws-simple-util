import * as aws from 'aws-sdk';
import { SERVICE_NAME } from './options';
export class S3 {
    constructor(opt) {
        this.s3 = new aws.S3({
            region: opt.region,
            endpoint: opt.endpoint(SERVICE_NAME.S3, opt.id),
        });
    }
    headObject(params) {
        return new Promise((resolve, reject) => {
            this.s3.headObject(params, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        });
    }
    getObject(params) {
        return new Promise((resolve, reject) => {
            this.s3.getObject(params, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        });
    }
    listBucket(params) {
        return new Promise((resolve, reject) => {
            this.s3.listObjectsV2(params, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        });
    }
    async deleteObjects(params) {
        if (params.Delete.Objects.length < 0) {
            return Promise.resolve({});
        }
        if (params.Delete.Objects.length > 1000) {
            const copy = JSON.parse(JSON.stringify(params));
            delete copy.Delete.Objects;
            let results = new Array();
            for (let i = 0; i < params.Delete.Objects.length; i += 1000) {
                copy.Delete.Objects = params.Delete.Objects.slice(i, i + 1000);
                results = results.concat(await this.deleteObjects(copy));
            }
            const response = results[0];
            for (let i = 1; i < results.length; i++) {
                if (response.Deleted) {
                    response.Deleted = response.Deleted.concat(results[i].Deleted);
                }
                else {
                    response.Deleted = results[i].Deleted;
                }
                if (response.Errors) {
                    response.Errors = response.Errors.concat(results[i].Errors);
                }
                else {
                    response.Errors = results[i].Errors;
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
        });
    }
}
