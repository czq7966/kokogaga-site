import { EventEmitter } from "events";

export interface IBase {
    notDestroyed: boolean
    eventEmitter: EventEmitter,
    destroy()
}
export class Base {
    notDestroyed: boolean
    eventEmitter: EventEmitter
    constructor() {
        this.notDestroyed = true;
        this.eventEmitter = new EventEmitter();
    }
    destroy() {
        this.eventEmitter.removeAllListeners();
        delete this.eventEmitter;
        delete this.notDestroyed;
    }
}