/** from https://github.com/aws-containers/ecs-task-protection-examples/blob/main/queue-consumer/lib/protection-manager.js **/
/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class EcsProtectionManager extends EventEmitter {
    private desiredState;
    private currentState;
    private lastStateChange;
    private interval;
    private desiredProtectionDurationInMins;
    private protectionAdjustIntervalInMs;
    private maintainProtectionPercentage;
    private refreshProtectionPercentage;
    /**
     * @constructor
     * @param {*} protectionSettings
     * @param {*} protectionSettings.desiredProtectionDurationInMins - How long in minutes to protect the process on calling the acquire method
     * @param {*} protectionSettings.maintainProtectionPercentage - Number between 0 and 100 that expresses percentage of desired protection to maintain if release is called early
     * @param {*} protectionSettings.refreshProtectionPercentage - Number between 0 and 100 that expresses percentage of desired protection duration to let pass before doing an early refresh
     * @param {*} protectionSettings.protectionAdjustIntervalInMs - How frequently in ms to attempt/verify state matches desire
     */
    constructor(desiredProtectionDurationInMins: number, maintainProtectionPercentage: number, refreshProtectionPercentage: number, protectionAdjustIntervalInMs: number);
    private attemptAdjustProtection;
    /**
     * Set the desired state to protected and wait for protection to be successfully acquired
     */
    acquire(): Promise<unknown>;
    /**
     * Set the desired state to unprotected and wait for protection to be successfully released
     */
    release(): Promise<unknown>;
    /**
     * When it is time to stop the process this clears
     * the interval so that it no longer keeps the event loop alive.
     */
    close(): void;
}
