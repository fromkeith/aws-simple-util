let logInstance = (msg, data) => console.log(msg, data);
export function setAwsSimpleLogger(logger) {
    logInstance = logger;
}
export function log(msg, data) {
    logInstance(msg, data);
}
