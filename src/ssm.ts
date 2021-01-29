import * as aws from 'aws-sdk';
import {IServiceOptions, SERVICE_NAME} from './options';


export class Ssm {
    private ssm: aws.SSM;
    constructor(opt: IServiceOptions) {
        this.ssm = new aws.SSM({
            region: opt.region,
            endpoint: opt.endpoint(SERVICE_NAME.SSM, opt.id),
        });
    }

    public async getConfig(prefix?: string): Promise<Map<string, string>> {
        if (!prefix) {
            prefix = process.env.SSM_PREFIX;
        }
        // ensure we always have the ending slash!
        if (prefix.lastIndexOf('/') !== prefix.length - 1) {
            prefix += '/';
        }
        const config = new Map<string, string>();
        let next: string;
        for (;;) {
            const resp = await this.ssm.getParametersByPath({
                Path: prefix,
                Recursive: true,
                WithDecryption: true,
                NextToken: next,
            }).promise();
            for (const p of resp.Parameters) {
                config.set(p.Name.substr(prefix.length), p.Value);
            }
            if (!resp.NextToken) {
                break;
            }
            next = resp.NextToken;
        }
        return config;
    }

}