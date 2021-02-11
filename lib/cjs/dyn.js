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
exports.DynamoDB = exports.CACHE_ACTION = void 0;
const ratelimit_1 = require("./ratelimit");
const aws = __importStar(require("aws-sdk"));
const options_1 = require("./options");
const logger_1 = require("./logger");
var CACHE_ACTION;
(function (CACHE_ACTION) {
    CACHE_ACTION["READ"] = "read";
    CACHE_ACTION["WRITE"] = "write";
})(CACHE_ACTION = exports.CACHE_ACTION || (exports.CACHE_ACTION = {}));
class DynamoDB {
    constructor(opt) {
        // A read capacity unit represents one strongly consistent read per second, or two eventually consistent reads per second, for an item up to 4 KB in size.
        // For example, suppose that you create a table with 10 provisioned read capacity units. This allows you to perform 10 strongly consistent reads per second, or 20 eventually consistent reads per second, for items up to 4 KB.
        // Reading an item larger than 4 KB consumes more read capacity units. For example, a strongly consistent read of an item that is 8 KB (4 KB × 2) consumes 2 read capacity units. An eventually consistent read on that same item consumes only 1 read capacity unit.
        // Item sizes for reads are rounded up to the next 4 KB multiple. For example, reading a 3,500-byte item consumes the same throughput as reading a 4 KB item.
        this.rateLimiting = new Map();
        this.dyn = new aws.DynamoDB({
            region: opt.region,
            endpoint: opt.endpoint(options_1.SERVICE_NAME.DYN, opt.id),
            credentials: opt.credentials(options_1.SERVICE_NAME.DYN, opt.id),
        });
    }
    setRateLimit(tableName, action, limit) {
        const key = `${tableName}-${action}`;
        this.rateLimiting.set(key, new ratelimit_1.PtRateLimter(limit, 'second'));
    }
    getRateLimiter(tableName, action) {
        const key = `${tableName}-${action}`;
        if (!this.rateLimiting.has(key)) {
            this.setRateLimit(tableName, action, 20);
            // so we are say 20 consistent reads of 4KB per second.
        }
        return this.rateLimiting.get(key);
    }
    updateItem(updateInput, skipPreThrottle = false) {
        let estimatedConsumption = 1;
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(updateInput.TableName, CACHE_ACTION.WRITE);
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.updateItem(Object.assign({
                ReturnConsumedCapacity: 'TOTAL',
            }, updateInput), (err, data) => {
                if (err) {
                    logger_1.log('updateItem failed', updateInput.TableName);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data) => {
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                logger_1.log('our consumption estimate was wrong for updateItem.', { estimatedConsumption, usedCapacity, table: updateInput.TableName });
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Attributes) {
                return null;
            }
            return aws.DynamoDB.Converter.unmarshall(data.Attributes);
        });
    }
    putItem(putItemInput, skipPreThrottle = false) {
        let estimatedConsumption = 1;
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(putItemInput.TableName, CACHE_ACTION.WRITE);
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.putItem(Object.assign({
                ReturnConsumedCapacity: 'TOTAL',
            }, putItemInput), (err, data) => {
                if (err) {
                    logger_1.log('putItem failed', putItemInput.TableName);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data) => {
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                logger_1.log('our consumption estimate was wrong for putItem.', { estimatedConsumption, usedCapacity, table: putItemInput.TableName });
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Attributes) {
                return null;
            }
            return aws.DynamoDB.Converter.unmarshall(data.Attributes);
        });
    }
    getItem(getInput, skipPreThrottle = false) {
        let estimatedConsumption = 1;
        if (getInput.ConsistentRead) {
            estimatedConsumption = 0.5;
        }
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(getInput.TableName, CACHE_ACTION.READ);
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.getItem(Object.assign({
                ReturnConsumedCapacity: 'TOTAL',
            }, getInput), (err, data) => {
                if (err) {
                    logger_1.log('getItem failed', getInput.TableName);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data) => {
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                logger_1.log('our consumption estimate was wrong for getItem.', { estimatedConsumption, usedCapacity, table: getInput.TableName });
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Item) {
                return null;
            }
            return aws.DynamoDB.Converter.unmarshall(data.Item);
        });
    }
    queryTable(queryInput, next, skipPreThrottle = false) {
        let estimatedConsumption = 20;
        if (queryInput.Limit) {
            estimatedConsumption = queryInput.Limit / 2;
        }
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(queryInput.TableName, CACHE_ACTION.READ);
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.query(Object.assign({
                ConsistentRead: false,
                ExclusiveStartKey: next,
                ReturnConsumedCapacity: 'TOTAL',
            }, queryInput), (err, data) => {
                if (err) {
                    logger_1.log('queryTable failed', queryInput.TableName);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data) => {
            // we under estimated!
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                logger_1.log('our consumption estimate was wrong for queryTable.', { estimatedConsumption, usedCapacity, table: queryInput.TableName });
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Items || data.Items.length === 0) {
                return {
                    items: [],
                    next: data.LastEvaluatedKey,
                };
            }
            const out = data.Items.map((item) => {
                return aws.DynamoDB.Converter.unmarshall(item);
            });
            return {
                items: out,
                next: data.LastEvaluatedKey,
            };
        });
    }
    scanTable(queryInput, next) {
        let estimatedConsumption = 20;
        if (queryInput.Limit) {
            estimatedConsumption = queryInput.Limit / 2;
        }
        const limit = this.getRateLimiter(queryInput.TableName, CACHE_ACTION.READ);
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.scan(Object.assign({
                ConsistentRead: false,
                ExclusiveStartKey: next,
                ReturnConsumedCapacity: 'TOTAL',
            }, queryInput), (err, data) => {
                if (err) {
                    logger_1.log('scanTable failed', err);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data) => {
            // we under estimated!
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                logger_1.log('our consumption estimate was wrong for queryTable.', { estimatedConsumption, usedCapacity, table: queryInput.TableName });
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Items || data.Items.length === 0) {
                return {
                    items: [],
                    next: data.LastEvaluatedKey,
                };
            }
            const out = data.Items.map((item) => {
                return aws.DynamoDB.Converter.unmarshall(item);
            });
            return {
                items: out,
                next: data.LastEvaluatedKey,
            };
        });
    }
    async batchGet(batchInput, skipPreThrottle = false) {
        const tableNames = Object.keys(batchInput.RequestItems);
        if (tableNames.length !== 1) {
            throw new Error('Unsupported # of tables - dyn.ts');
        }
        const numItems = batchInput.RequestItems[tableNames[0]].Keys.length;
        if (numItems > 100) {
            const copy = JSON.parse(JSON.stringify(batchInput));
            delete copy.RequestItems[tableNames[0]].Keys;
            let results = new Array();
            for (let i = 0; i < batchInput.RequestItems[tableNames[0]].Keys.length; i += 100) {
                copy.RequestItems[tableNames[0]].Keys = batchInput.RequestItems[tableNames[0]].Keys.slice(i, i + 100);
                results = results.concat(await this.batchGet(copy, skipPreThrottle));
            }
            return results;
        }
        if (numItems === 0) {
            return Promise.resolve([]); // no keys!
        }
        let estimatedConsumption = numItems / 2;
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(tableNames[0], CACHE_ACTION.READ);
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.batchGetItem(Object.assign({
                ReturnConsumedCapacity: 'TOTAL',
            }, batchInput), (err, data) => {
                if (err) {
                    logger_1.log('batchGet failed', err);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data) => {
            // we under estimated!
            const usedCapacity = data.ConsumedCapacity[0].CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                logger_1.log('our consumption estimate was wrong for batchGet.', { estimatedConsumption, usedCapacity, table: tableNames[0] });
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            let out = [];
            if (data.Responses[tableNames[0]]) {
                out = data.Responses[tableNames[0]].map((item) => {
                    return aws.DynamoDB.Converter.unmarshall(item);
                });
            }
            if (data.UnprocessedKeys && data.UnprocessedKeys[tableNames[0]]) {
                const copy = JSON.parse(JSON.stringify(batchInput));
                delete copy.RequestItems[tableNames[0]].Keys;
                copy.RequestItems[tableNames[0]].Keys = data.UnprocessedKeys[tableNames[0]].Keys;
                const subset = await this.batchGet(copy, skipPreThrottle);
                return subset.concat(out);
            }
            return out;
        });
    }
    async batchWrite(batchInput, skipPreThrottle = false) {
        const tableNames = Object.keys(batchInput.RequestItems);
        if (tableNames.length !== 1) {
            throw new Error('Unsupported # of tables - dyn.ts');
        }
        const numItems = batchInput.RequestItems[tableNames[0]].length;
        if (numItems > 25) {
            const copy = JSON.parse(JSON.stringify(batchInput));
            delete copy.RequestItems[tableNames[0]];
            for (let i = 0; i < batchInput.RequestItems[tableNames[0]].length; i += 25) {
                copy.RequestItems[tableNames[0]] = batchInput.RequestItems[tableNames[0]].slice(i, i + 25);
                await this.batchWrite(copy, skipPreThrottle);
            }
            return;
        }
        if (numItems === 0) {
            return Promise.resolve(); // no keys!
        }
        let estimatedConsumption = numItems / 2;
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(tableNames[0], CACHE_ACTION.WRITE);
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.batchWriteItem(Object.assign({
                ReturnConsumedCapacity: 'TOTAL',
            }, batchInput), (err, data) => {
                if (err) {
                    logger_1.log('batchWrite failed', err);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data) => {
            // we under estimated!
            const usedCapacity = data.ConsumedCapacity[0].CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                logger_1.log('our consumption estimate was wrong for batchGet.', { estimatedConsumption, usedCapacity, table: tableNames[0] });
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (data.UnprocessedItems && data.UnprocessedItems[tableNames[0]]) {
                const copy = JSON.parse(JSON.stringify(batchInput));
                delete copy.RequestItems[tableNames[0]];
                copy.RequestItems[tableNames[0]] = data.UnprocessedItems[tableNames[0]];
                await this.batchWrite(copy, skipPreThrottle);
                return;
            }
            return;
        });
    }
}
exports.DynamoDB = DynamoDB;
