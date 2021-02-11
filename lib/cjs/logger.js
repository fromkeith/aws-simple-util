"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.setAwsSimpleLogger = void 0;
let logInstance = (msg, data) => console.log(msg, data);
function setAwsSimpleLogger(logger) {
    logInstance = logger;
}
exports.setAwsSimpleLogger = setAwsSimpleLogger;
function log(msg, data) {
    logInstance(msg, data);
}
exports.log = log;
