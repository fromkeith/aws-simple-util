# aws-simple-util

Solves some very basic common use cases with the aws-sdk.

* Mostly tend to work in 1 region
    * Expects the ENV flag `AWS_REGION` to be set.
* Batch calls to services should auto be split to fit in limits.
    * eg. `sqs.BatchSend` only allows 10 messages per call. This library automatically splits any input of over 10 messages into subcalls.
* Simplifies configuration by uses Parameter Store.
    * eg. a worker will most likely always pull from the 1 SQS queue.
* Attempts to work within dynamodb's rate limiting.


# Quick Start

```
import {aws} from 'aws-simple-util';

const config = await aws().ssm.getConfig('/live/serviceA');
```

If you need a service from a specific region:
```
const config = await aws('us-west-2').ssm.getConfig('/live/serviceA');
```

# Services


## DynamoDB

* Adds a rate limiter for reading/writing to a table.

## Firehose

* Auto splits large bulk pushes.
* Retries if trying to push too fast.

## S3

* Promisify the calls. TODO: use built in promise api.
* Auto splits batch calls to `deleteObjects`

## SQS

* Auto splits batch delete/enqueue calls.
* Adds helper methods based on SSM to pull (`ReceiveTaskQueue`) and push (`SendTaskQueue`) to expected queues.

## SSM

* Pulls a prefix and all the subsequent keys/values. Removes the prefix from the name, and stores it into a map.
    * eg. Prefix `/live/serviceA` will pull all keys below that, eg. `/live/serviceA/ReceiveTaskQueue`. It will also remove the prefix so that the returned Map has `ReceiveTaskQueue` as a key.

