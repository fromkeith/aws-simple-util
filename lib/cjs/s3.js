"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const aws = __importStar(require("aws-sdk"));
class S3 {
    constructor(region) {
        this.s3 = new aws.S3({ region });
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
exports.S3 = S3;
