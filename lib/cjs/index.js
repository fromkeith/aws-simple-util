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
exports.aws = void 0;
const ssm = __importStar(require("./ssm"));
const sqs = __importStar(require("./sqs"));
const dyn = __importStar(require("./dyn"));
const firehose = __importStar(require("./firehose"));
const s3 = __importStar(require("./s3"));
const regions = new Map();
function aws(region) {
    if (!region) {
        region = process.env.AWS_REGION || 'us-west-2';
    }
    if (!regions.has(region)) {
        regions.set(region, {
            ssm: new ssm.Ssm(region),
            sqs: new sqs.Sqs(region),
            dyn: new dyn.DynamoDB(region),
            firehose: new firehose.Firehose(region),
            s3: new s3.S3(region),
        });
    }
    return regions.get(region);
}
exports.aws = aws;
__exportStar(require("./sleep"), exports);
