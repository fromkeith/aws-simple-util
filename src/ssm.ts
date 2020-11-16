import * as aws from 'aws-sdk';


export class Ssm {
    private ssm: aws.SSM;
    constructor(region: string) {
        this.ssm = new aws.SSM({region});
    }

    public getConfig(prefix?: string): Promise<Map<string, string>> {
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
            }, (err, resp: aws.SSM.GetParametersByPathResult) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        }).then((resp: aws.SSM.GetParametersByPathResult) => {
            const config = new Map<string, string>();
            for (const p of resp.Parameters) {
                config.set(p.Name.substr(prefix.length), p.Value);
            }
            return config;
        });
    }

}