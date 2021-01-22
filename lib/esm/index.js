import * as ssm from './ssm';
import * as sqs from './sqs';
import * as dyn from './dyn';
import * as firehose from './firehose';
import * as s3 from './s3';
class RegionedServices {
    constructor(opt) {
        this.opt = opt;
        if (!this.opt.endpoint) {
            this.opt.endpoint = () => undefined;
        }
    }
    get ssm() {
        if (!this._ssm) {
            this._ssm = new ssm.Ssm(this.opt);
        }
        return this._ssm;
    }
    get sqs() {
        if (!this._sqs) {
            this._sqs = new sqs.Sqs(this.opt);
        }
        return this._sqs;
    }
    get dyn() {
        if (!this._dyn) {
            this._dyn = new dyn.DynamoDB(this.opt);
        }
        return this._dyn;
    }
    get firehose() {
        if (!this._firehose) {
            this._firehose = new firehose.Firehose(this.opt);
        }
        return this._firehose;
    }
    get s3() {
        if (!this._s3) {
            this._s3 = new s3.S3(this.opt);
        }
        return this._s3;
    }
}
const regions = new Map();
export function aws(opt) {
    if (!opt) {
        opt = {
            region: process.env.AWS_REGION || 'us-west-2',
            id: '--reserved--default--',
        };
    }
    else if (typeof opt === 'string') {
        opt = {
            region: opt,
            id: opt,
        };
    }
    if (!regions.has(opt.id)) {
        regions.set(opt.id, new RegionedServices(opt));
    }
    return regions.get(opt.id);
}
export { CACHE_ACTION, } from './dyn';
export { SERVICE_NAME } from './options';
export * from './sleep';
