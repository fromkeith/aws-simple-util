export type LoggerFunc = (msg: string, data: any) => void;
export declare function setAwsSimpleLogger(logger: LoggerFunc): void;
export declare function log(msg: string, data: any): void;
