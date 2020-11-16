export declare class Ssm {
    private ssm;
    constructor(region: string);
    getConfig(prefix?: string): Promise<Map<string, string>>;
}
