import * as aws from 'aws-sdk';
import {sleep} from './sleep';
import {IServiceOptions, SERVICE_NAME} from './options';


export class Firehose {
    private firehose: aws.Firehose;

    constructor(opt: IServiceOptions) {
        this.firehose = new aws.Firehose({
            region: opt.region,
            endpoint: opt.endpoint(SERVICE_NAME.FIREHOSE, opt.id),
            credentials: opt.credentials(SERVICE_NAME.FIREHOSE, opt.id),
        });
    }

    public pushToFirehose(streamName: string, records: any[]): Promise<void> {
        if (records.length === 0) {
            return Promise.resolve();
        }
        if (records.length > 500) {
            return Promise.all([
                this.pushToFirehose(streamName, records.slice(0, records.length / 2)),
                this.pushToFirehose(streamName, records.slice(records.length / 2)),
            ]).then(() => {
                // void
            });
        }
        if (Buffer.from(JSON.stringify(records)).length > 4 * 1024 * 1024) {
            return Promise.all([
                this.pushToFirehose(streamName, records.slice(0, records.length / 2)),
                this.pushToFirehose(streamName, records.slice(records.length / 2)),
            ]).then(() => {
                // void
            });
        }
        return new Promise((resolve, reject) => {
            this.firehose.putRecordBatch({
                DeliveryStreamName: streamName,
                Records: records.map((item) => {
                    return {Data: JSON.stringify(item) + '\n'};
                }),
            }, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then(async (resp: aws.Firehose.PutRecordBatchOutput) => {
            if (resp.FailedPutCount > 0) {
                let retry = [];
                for (let i = 0; i < resp.RequestResponses.length; i++) {
                    const failed = resp.RequestResponses[i];
                    if (failed.ErrorCode === 'ServiceUnavailableException') {
                        retry.push(records[i]);
                    }
                }
                if (retry.length > 0) {
                    await sleep(100 * retry.length);
                    return this.pushToFirehose(streamName, retry);
                }
            }
        });
    }

}