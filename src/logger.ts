
export type LoggerFunc = (msg: string, data: any) => void;


let logInstance: LoggerFunc = (msg, data) => console.log(msg, data);

export function setAwsSimpleLogger(logger: LoggerFunc) {
    logInstance = logger;
}

export function log(msg: string, data: any) {
    logInstance(msg, data);
}
