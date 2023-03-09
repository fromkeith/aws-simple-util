import * as ssm from './ssm';
import * as sqs from './sqs';
import * as dyn from './dyn';
import * as firehose from './firehose';
import * as s3 from './s3';
import {IServiceOptions} from './options';


class RegionedServices {
    _ssm: ssm.Ssm;
    _sqs: sqs.Sqs;
    _dyn: dyn.DynamoDB;
    _firehose: firehose.Firehose;
    _s3: s3.S3;

    constructor(private opt: IServiceOptions) {
        if (!this.opt.endpoint) {
            this.opt.endpoint = () => undefined;
        }
        if (!this.opt.credentials) {
            this.opt.credentials = () => undefined;
        }
    }

    get ssm(): ssm.Ssm {
        if (!this._ssm) {
            this._ssm = new ssm.Ssm(this.opt);
        }
        return this._ssm;
    }
    get sqs(): sqs.Sqs {
        if (!this._sqs) {
            this._sqs = new sqs.Sqs(this.opt);
        }
        return this._sqs;
    }
    get dyn(): dyn.DynamoDB {
        if (!this._dyn) {
            this._dyn = new dyn.DynamoDB(this.opt);
        }
        return this._dyn;
    }
    get firehose(): firehose.Firehose {
        if (!this._firehose) {
            this._firehose = new firehose.Firehose(this.opt);
        }
        return this._firehose;
    }
    get s3(): s3.S3 {
        if (!this._s3) {
            this._s3 = new s3.S3(this.opt);
        }
        return this._s3;
    }
}



const regions = new Map<string, RegionedServices>();


export function aws(opt?: IServiceOptions | string): RegionedServices {
    if (!opt) {
        opt = {
            region: process.env.AWS_REGION || 'us-west-2',
            id: '--reserved--default--',
        };
    } else if (typeof opt === 'string') {
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

export {
    ISqsMessage,
} from './sqs';

export {
    IQueryResult,
    CACHE_ACTION,
} from './dyn';

export {IServiceOptions, SERVICE_NAME} from './options';

export * from './sleep';
export {VisibilityExtender} from './sqs.extender';
export {EcsProtectionManager} from './ecs.protection';
export {LoggerFunc, setAwsSimpleLogger} from './logger';