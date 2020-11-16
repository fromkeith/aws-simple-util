"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ssm = void 0;
const aws = __importStar(require("aws-sdk"));
class Ssm {
    constructor(region) {
        this.ssm = new aws.SSM({ region });
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
exports.Ssm = Ssm;
