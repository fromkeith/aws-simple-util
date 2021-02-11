import * as ssm from './ssm';
import * as sqs from './sqs';
import * as dyn from './dyn';
import * as firehose from './firehose';
import * as s3 from './s3';
import { IServiceOptions } from './options';
declare class RegionedServices {
    private opt;
    _ssm: ssm.Ssm;
    _sqs: sqs.Sqs;
    _dyn: dyn.DynamoDB;
    _firehose: firehose.Firehose;
    _s3: s3.S3;
    constructor(opt: IServiceOptions);
    get ssm(): ssm.Ssm;
    get sqs(): sqs.Sqs;
    get dyn(): dyn.DynamoDB;
    get firehose(): firehose.Firehose;
    get s3(): s3.S3;
}
export declare function aws(opt?: IServiceOptions | string): RegionedServices;
export { ISqsMessage, } from './sqs';
export { IQueryResult, CACHE_ACTION, } from './dyn';
export { IServiceOptions, SERVICE_NAME } from './options';
export * from './sleep';
export { VisibilityExtender } from './sqs.extender';
export { LoggerFunc, setAwsSimpleLogger } from './logger';
