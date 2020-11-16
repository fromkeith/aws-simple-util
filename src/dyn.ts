import {PtRateLimter} from './ratelimit';
import * as aws from 'aws-sdk';

export interface IQueryResult<T> {
    next: any;
    items: T[];
}


export class DynamoDB {
    private dyn: aws.DynamoDB;

    // A read capacity unit represents one strongly consistent read per second, or two eventually consistent reads per second, for an item up to 4 KB in size.
    // For example, suppose that you create a table with 10 provisioned read capacity units. This allows you to perform 10 strongly consistent reads per second, or 20 eventually consistent reads per second, for items up to 4 KB.
    // Reading an item larger than 4 KB consumes more read capacity units. For example, a strongly consistent read of an item that is 8 KB (4 KB × 2) consumes 2 read capacity units. An eventually consistent read on that same item consumes only 1 read capacity unit.
    // Item sizes for reads are rounded up to the next 4 KB multiple. For example, reading a 3,500-byte item consumes the same throughput as reading a 4 KB item.
    private rateLimiting = new Map<string, PtRateLimter>();

    constructor(region: string) {
        this.dyn = new aws.DynamoDB({region});
    }

    private getRateLimiter(tableName: string, action: string): PtRateLimter {
        const key = `${tableName}-${action}`;
        if (!this.rateLimiting.has(key)) {
            this.rateLimiting.set(key, new PtRateLimter(20, 'second'));
            // so we are say 20 consistent reads of 4KB per second.
        }
        return this.rateLimiting.get(key);
    }

    public updateItem<T>(updateInput: aws.DynamoDB.UpdateItemInput, skipPreThrottle: boolean = false): Promise<T> {
        let estimatedConsumption = 1;
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(updateInput.TableName, 'write')
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.updateItem(Object.assign({
                ReturnConsumedCapacity: 'TOTAL',
            }, updateInput), (err, data) => {
                if (err) {
                    console.log('updateItem failed', updateInput.TableName);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data: aws.DynamoDB.UpdateItemOutput) => {
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                console.log('our consumption estimate was wrong for updateItem.', {estimatedConsumption, usedCapacity, table: updateInput.TableName});
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Attributes) {
                return null;
            }
            return aws.DynamoDB.Converter.unmarshall(data.Attributes) as T;
        });
    }

    public getItem<T>(getInput: aws.DynamoDB.GetItemInput, skipPreThrottle: boolean = false): Promise<T> {
        let estimatedConsumption = 1;
        if (getInput.ConsistentRead) {
            estimatedConsumption = 0.5
        }
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(getInput.TableName, 'read')
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.getItem(Object.assign({
                ReturnConsumedCapacity: 'TOTAL',
            }, getInput), (err, data) => {
                if (err) {
                    console.log('getItem failed', getInput.TableName);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data: aws.DynamoDB.GetItemOutput) => {
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                console.log('our consumption estimate was wrong for getItem.', {estimatedConsumption, usedCapacity, table: getInput.TableName});
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Item) {
                return null;
            }
            return aws.DynamoDB.Converter.unmarshall(data.Item) as T;
        });
    }

    public queryTable<T>(queryInput: aws.DynamoDB.QueryInput, next?: any, skipPreThrottle: boolean = false): Promise<IQueryResult<T>> {
        let estimatedConsumption = 20;
        if (queryInput.Limit) {
            estimatedConsumption = queryInput.Limit / 2;
        }
        if (skipPreThrottle) {
            estimatedConsumption = 0;
        }
        const limit = this.getRateLimiter(queryInput.TableName, 'read')
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.query(Object.assign({
                ConsistentRead: false,
                ExclusiveStartKey: next,
                ReturnConsumedCapacity: 'TOTAL',
            }, queryInput), (err, data) => {
                if (err) {
                    console.log('queryTable failed', queryInput.TableName);
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data: aws.DynamoDB.QueryOutput) => {
            // we under estimated!
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                console.log('our consumption estimate was wrong for queryTable.', {estimatedConsumption, usedCapacity, table: queryInput.TableName});
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Items || data.Items.length === 0) {
                return {
                    items: [],
                    next: data.LastEvaluatedKey,
                };
            }
            const out: Array<T> = data.Items.map((item) => {
                return aws.DynamoDB.Converter.unmarshall(item) as T;
            });
            return {
                items: out,
                next: data.LastEvaluatedKey,
            };
        });
    }

    public scanTable<T>(queryInput: aws.DynamoDB.ScanInput, next?: any): Promise<IQueryResult<T>> {
        let estimatedConsumption = 20;
        if (queryInput.Limit) {
            estimatedConsumption = queryInput.Limit / 2;
        }
        const limit = this.getRateLimiter(queryInput.TableName, 'read')
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.scan(Object.assign({
                ConsistentRead: false,
                ExclusiveStartKey: next,
                ReturnConsumedCapacity: 'TOTAL',
            }, queryInput), (err, data) => {
                if (err) {
                    console.log('scanTable failed');
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data: aws.DynamoDB.ScanOutput) => {
            // we under estimated!
            const usedCapacity = data.ConsumedCapacity.CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                console.log('our consumption estimate was wrong for queryTable.', {estimatedConsumption, usedCapacity, table: queryInput.TableName});
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            if (!data.Items || data.Items.length === 0) {
                return {
                    items: [],
                    next: data.LastEvaluatedKey,
                };
            }
            const out: Array<T> = data.Items.map((item) => {
                return aws.DynamoDB.Converter.unmarshall(item) as T;
            });
            return {
                items: out,
                next: data.LastEvaluatedKey,
            };
        });
    }

    public async batchGet<T>(batchInput: aws.DynamoDB.BatchGetItemInput, skipPreThrottle: boolean = false): Promise<T[]> {
        const tableNames = Object.keys(batchInput.RequestItems);
        if (tableNames.length !== 1) {
            throw new Error('Unsupported # of tables - dyn.ts');
        }
        const numItems = batchInput.RequestItems[tableNames[0]].Keys.length;
        if (numItems > 100) {
            const copy: aws.DynamoDB.BatchGetItemInput = JSON.parse(JSON.stringify(batchInput));
            delete copy.RequestItems[tableNames[0]].Keys;
            let results = new Array<T>();
            for (let i = 0; i < batchInput.RequestItems[tableNames[0]].Keys.length; i+=100) {
                copy.RequestItems[tableNames[0]].Keys = batchInput.RequestItems[tableNames[0]].Keys.slice(i, i + 100);
                results = results.concat(await this.batchGet<T>(copy, skipPreThrottle));
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
        const limit = this.getRateLimiter(tableNames[0], 'read');
        return limit.removeTokens(estimatedConsumption).then(() => new Promise((resolve, reject) => {
            this.dyn.batchGetItem(Object.assign({
                ReturnConsumedCapacity: 'TOTAL',
            }, batchInput), (err, data) => {
                if (err) {
                    console.log('batchGet failed');
                    reject(err);
                    return;
                }
                resolve(data);
            });
        })).then(async (data: aws.DynamoDB.BatchGetItemOutput) => {
            // we under estimated!
            const usedCapacity = data.ConsumedCapacity[0].CapacityUnits;
            if (usedCapacity > estimatedConsumption) {
                console.log('our consumption estimate was wrong for batchGet.', {estimatedConsumption, usedCapacity, table: tableNames[0]});
                await limit.removeTokens(usedCapacity - estimatedConsumption);
            }
            let out: Array<T> = [];
            if (data.Responses[tableNames[0]]) {
                out = data.Responses[tableNames[0]].map((item) => {
                    return aws.DynamoDB.Converter.unmarshall(item) as T;
                });
            }

            if (data.UnprocessedKeys && data.UnprocessedKeys[tableNames[0]]) {
                const copy: aws.DynamoDB.BatchGetItemInput = JSON.parse(JSON.stringify(batchInput));
                delete copy.RequestItems[tableNames[0]].Keys;
                copy.RequestItems[tableNames[0]].Keys = data.UnprocessedKeys[tableNames[0]].Keys;
                const subset = await this.batchGet<T>(copy, skipPreThrottle);
                return subset.concat(out);
            }
            return out;
        });
    }
}
