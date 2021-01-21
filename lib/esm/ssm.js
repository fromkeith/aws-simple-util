import * as aws from 'aws-sdk';
import { SERVICE_NAME } from './options';
export class Ssm {
    constructor(opt) {
        this.ssm = new aws.SSM({
            region: opt.region,
            endpoint: opt.endpoint(SERVICE_NAME.SSM, opt.id),
        });
    }
    getConfig(prefix) {
        if (!prefix) {
            prefix = process.env.SSM_PREFIX;
        }
        // ensure we always have the ending slash!
        if (prefix.lastIndexOf('/') !== prefix.length - 1) {
            prefix += '/';
        }
        return new Promise((resolve, reject) => {
            this.ssm.getParametersByPath({
                Path: prefix,
                Recursive: true,
                WithDecryption: true,
            }, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then((resp) => {
            const config = new Map();
            for (const p of resp.Parameters) {
                config.set(p.Name.substr(prefix.length), p.Value);
            }
            return config;
        });
    }
}
