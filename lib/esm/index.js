import * as ssm from './ssm';
import * as sqs from './sqs';
import * as dyn from './dyn';
import * as firehose from './firehose';
import * as s3 from './s3';
const regions = new Map();
export function aws(region) {
    if (!region) {
        region = process.env.AWS_REGION || 'us-west-2';
    }
    if (!regions.has(region)) {
        regions.set(region, {
            ssm: new ssm.Ssm(region),
            sqs: new sqs.Sqs(region),
            dyn: new dyn.DynamoDB(region),
            firehose: new firehose.Firehose(region),
            s3: new s3.S3(region),
        });
    }
    return regions.get(region);
}
export * from './sleep';
