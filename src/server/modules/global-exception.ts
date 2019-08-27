import { IServer } from "./server";

export interface IGlobalExpcetion {
    server: IServer
    destroy()
}

export class GlobalExpcetion {
    server: IServer
    constructor(server: IServer){
        this.server = server
        this.initEvents();
    }    
    destroy() {
        this.unInitEvents()
    }
    initEvents() {
        process.on('uncaughtException', this.uncaughtException)
        process.on('unhandledRejection', this.unhandledRejection)
    }
    unInitEvents() {
        process.off('uncaughtException', this.uncaughtException)
        process.off('unhandledRejection', this.unhandledRejection) 
    }
    uncaughtException = (error: Error) => {
        console.log('uncaughtException:', error)
        // this.resetNamespaces();
    }
    unhandledRejection =(reason: any, promise: Promise<any>) => {
        console.log('unhandledRejection:', reason);
        // this.resetNamespaces();
    }
    resetNamespaces(delay?: number) {
        delay = delay || 3 * 1000;
        setTimeout(() => {
            this.server.resetNamespaces()
            .catch(err => {
                console.log('ResetNamespaces Error:', err)
            })        
        }, delay);
    }
}