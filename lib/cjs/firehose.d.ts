export declare class Firehose {
    private firehose;
    constructor(region: string);
    pushToFirehose(streamName: string, records: any[]): Promise<void>;
}
