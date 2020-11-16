export declare class PtRateLimter {
    private maxUnits;
    private base;
    private requests;
    private curRequest;
    constructor(maxUnits: number, timeUnit: string);
    removeTokens(num: number): Promise<void>;
    private processRequestsInOrder;
    private iterateOnRequest;
}
