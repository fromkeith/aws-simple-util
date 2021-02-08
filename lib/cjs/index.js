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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_NAME = exports.CACHE_ACTION = exports.aws = void 0;
const ssm = __importStar(require("./ssm"));
const sqs = __importStar(require("./sqs"));
const dyn = __importStar(require("./dyn"));
const firehose = __importStar(require("./firehose"));
const s3 = __importStar(require("./s3"));
class RegionedServices {
    constructor(opt) {
        this.opt = opt;
        if (!this.opt.endpoint) {
            this.opt.endpoint = () => undefined;
        }
        if (!this.opt.credentials) {
            this.opt.credentials = () => undefined;
        }
    }
    get ssm() {
        if (!this._ssm) {
            this._ssm = new ssm.Ssm(this.opt);
        }
        return this._ssm;
    }
    get sqs() {
        if (!this._sqs) {
            this._sqs = new sqs.Sqs(this.opt);
        }
        return this._sqs;
    }
    get dyn() {
        if (!this._dyn) {
            this._dyn = new dyn.DynamoDB(this.opt);
        }
        return this._dyn;
    }
    get firehose() {
        if (!this._firehose) {
            this._firehose = new firehose.Firehose(this.opt);
        }
        return this._firehose;
    }
    get s3() {
        if (!this._s3) {
            this._s3 = new s3.S3(this.opt);
        }
        return this._s3;
    }
}
const regions = new Map();
function aws(opt) {
    if (!opt) {
        opt = {
            region: process.env.AWS_REGION || 'us-west-2',
            id: '--reserved--default--',
        };
    }
    else if (typeof opt === 'string') {
        opt = {
            region: opt,
            id: opt,
        };
    }
    if (!regions.has(opt.id)) {
        regions.set(opt.id, new RegionedServices(opt));
    }
    return regions.get(opt.id);
}
exports.aws = aws;
var dyn_1 = require("./dyn");
Object.defineProperty(exports, "CACHE_ACTION", { enumerable: true, get: function () { return dyn_1.CACHE_ACTION; } });
var options_1 = require("./options");
Object.defineProperty(exports, "SERVICE_NAME", { enumerable: true, get: function () { return options_1.SERVICE_NAME; } });
__exportStar(require("./sleep"), exports);
