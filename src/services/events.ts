import { EventEmitter } from 'events';

// Create a global singleton EventEmitter for broadcasting invalidation events
class GlobalEventEmitter extends EventEmitter {}

export const eventEmitter = new GlobalEventEmitter();

// Increase max listeners if needed (default is 10)
eventEmitter.setMaxListeners(100);
