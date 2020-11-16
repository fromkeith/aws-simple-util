import * as ssm from './ssm';
import * as sqs from './sqs';
import * as dyn from './dyn';
import * as firehose from './firehose';
import * as s3 from './s3';
interface IRegionedServices {
    ssm: ssm.Ssm;
    sqs: sqs.Sqs;
    dyn: dyn.DynamoDB;
    firehose: firehose.Firehose;
    s3: s3.S3;
}
export declare function aws(region?: string): IRegionedServices;
export { ISqsMessage, } from './sqs';
export * from './sleep';
