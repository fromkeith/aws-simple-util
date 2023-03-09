/** from https://github.com/aws-containers/ecs-task-protection-examples/blob/main/queue-consumer/lib/protection-manager.js **/

import got from 'got';
import { EventEmitter } from 'events';

// This class manages the task protection state. It implements basic
// rate limiting, and emits events to let you know when it changes state.
// you can await the acquire() and release() methods if you want to ensure
// that task protection has reached the desired state before moving on.
export class EcsProtectionManager extends EventEmitter {
  private desiredState: string;
  private currentState: string;
  private lastStateChange: number;
  private interval: NodeJS.Timer;

  private desiredProtectionDurationInMins: number;
  private protectionAdjustIntervalInMs: number;
  private maintainProtectionPercentage: number;
  private refreshProtectionPercentage: number;
  /**
   * @constructor
   * @param {*} protectionSettings
   * @param {*} protectionSettings.desiredProtectionDurationInMins - How long in minutes to protect the process on calling the acquire method
   * @param {*} protectionSettings.maintainProtectionPercentage - Number between 0 and 100 that expresses percentage of desired protection to maintain if release is called early
   * @param {*} protectionSettings.refreshProtectionPercentage - Number between 0 and 100 that expresses percentage of desired protection duration to let pass before doing an early refresh
   * @param {*} protectionSettings.protectionAdjustIntervalInMs - How frequently in ms to attempt/verify state matches desire
   */
  constructor(desiredProtectionDurationInMins: number, maintainProtectionPercentage: number, refreshProtectionPercentage: number, protectionAdjustIntervalInMs: number) {
    super();
    this.desiredProtectionDurationInMins = desiredProtectionDurationInMins;
    this.protectionAdjustIntervalInMs = protectionAdjustIntervalInMs;
    this.maintainProtectionPercentage = maintainProtectionPercentage;
    this.refreshProtectionPercentage = refreshProtectionPercentage;

    if (!process.env.ECS_AGENT_URI) {
      throw new Error('ECS_AGENT_URI environment variable must be set. This is set automatically in an ECS task environment');
    }

    this.desiredState = 'unprotected';
    this.currentState = 'unprotected';
    this.lastStateChange = new Date().getTime();
    this.interval = setInterval(this.attemptAdjustProtection.bind(this), protectionAdjustIntervalInMs);
  }

  private async attemptAdjustProtection() {
    if (this.currentState == 'unprotected' &&
      this.desiredState == 'unprotected') {
      // Already unprotected so nothing to do right now.
      this.emit(this.currentState);
      return;
    }

    const now = new Date().getTime();
    const timeSinceLastChange = now - this.lastStateChange;
    const timeUntilProtectRefresh = this.desiredProtectionDurationInMins * 60 * 1000 * (this.refreshProtectionPercentage / 100);
    const timeUntilProtectRelease = this.desiredProtectionDurationInMins * 60 * 1000 * (this.maintainProtectionPercentage / 100);

    if (this.currentState == 'protected' &&
      this.desiredState == 'protected' &&
      timeSinceLastChange < timeUntilProtectRefresh) {
      // We are already protected and haven't yet reached 80% of the acquired protection duration
      // so no need to do an early refresh.
      this.emit(this.currentState);
      return;
    }

    if (this.currentState == 'protected' &&
      this.desiredState == 'unprotected' &&
      timeSinceLastChange < timeUntilProtectRelease) {
      // We are currently protected and not enough duration has passed since we became protected
      // so don't actually release the protection yet, maintain it for now.
      this.emit(this.currentState);
      return;
    }

    var ecsAgentParams;
    if (this.desiredState == 'unprotected') {
      ecsAgentParams = {
        ProtectionEnabled: false
      };
    } else if (this.desiredState == 'protected') {
      ecsAgentParams = {
        ProtectionEnabled: true,
        ExpiresInMinutes: this.desiredProtectionDurationInMins
      };
    }

    try {
      await got(`${process.env.ECS_AGENT_URI}/task-protection/v1/state`, {
        method: 'PUT',
        json: ecsAgentParams
      });
    } catch (e) {
      return this.emit('rejected', e);
    }

    this.lastStateChange = new Date().getTime();
    this.currentState = this.desiredState;
    this.emit(this.currentState);
  }

  /**
   * Set the desired state to protected and wait for protection to be successfully acquired
   */
  public async acquire() {
    this.desiredState = 'protected';
    return new Promise((resolve, reject) => {
      this.once('protected', resolve);
      this.attemptAdjustProtection(); // Immediate attempt to make an adjustment
    });
  }

  /**
   * Set the desired state to unprotected and wait for protection to be successfully released
   */
  public async release() {
    this.desiredState = 'unprotected';
    return new Promise((resolve, reject) => {
      this.once('unprotected', resolve);
      this.attemptAdjustProtection(); // Immediate attempt to make an adjustment
    });
  }

  /**
   * When it is time to stop the process this clears
   * the interval so that it no longer keeps the event loop alive.
   */
  public close() {
    clearInterval(this.interval);
  }
}