import { IServiceOptions } from './options';
export declare class Ssm {
    private ssm;
    constructor(opt: IServiceOptions);
    getConfig(prefix?: string): Promise<Map<string, string>>;
}
