import { IServiceOptions } from './options';
export declare class Firehose {
    private firehose;
    constructor(opt: IServiceOptions);
    pushToFirehose(streamName: string, records: any[]): Promise<void>;
}
