
import { EventEmitter } from 'events';
import * as Redis from 'redis'

import { ADHOCCAST } from '../libex'

export interface IRedisSocket extends Redis.RedisClient {
    id?: string
}

export interface IClientSocket extends ADHOCCAST.Network.ISignaler {
    socket: IRedisSocket
    // getPath(): string
    // setPath(value: string)
    // getServerChannel(id: string): string
    // getRoomChannel(namespace: string, id: string): string
    // getUserChannel(namespace: string, id: string): string
    // getShortChannel(namespace: string, id: string): string
    // getSocketChannel(namespace: string, id: string): string
}

export class ClientSocket implements IClientSocket {
    eventEmitter: EventEmitter;
    socket: IRedisSocket
    _url: string;
    _path: string;    

    constructor(url?: string, path?: string) {
        this.eventEmitter = new EventEmitter();
        this._url = url;   
        this._path = path;
    }
    destroy() {
        this.eventEmitter.removeAllListeners();
        this.socket && this.socket.connected && this.socket.end();
        this.unInitEvents(this.socket);
        delete this.eventEmitter;
        delete this.socket;
    }
    id(): string {
        return this.socket && this.socket.id;
    }
    getUrl(): string {
        return this._url;
    }
    setUrl(value: string, path?: string) {
        this._url = value;
        this._path = path || this._path;
    }
    // getPath(): string {
    //     return this._path;
    // }
    // setPath(value: string) {
    //     this._path = value;
    // }    

    connected(): boolean {
        return this.socket && this.socket.connected
    }
    connecting(): boolean {
        return !!this._connectPromise;
    }

    _connectPromise: Promise<any>;
    connect(url?: string, path?: string): Promise<any> {
        if (this.connected()) 
            return Promise.resolve();        
        if (this._connectPromise != null)
            return this._connectPromise;

        if (url) this.setUrl(url, path);
        this._connectPromise = new Promise((resolve, reject) => {
            this.unInitEvents(this.socket);
            delete this.socket;
            let options = this.getOptions();
            this.socket = Redis.createClient(options.url,options);
            this.socket.id = '#server-socket:' + ADHOCCAST.Cmds.Common.Helper.uuid();
            this.socket.once(ADHOCCAST.Dts.EClientSocketEvents.connect, () => {
 
            })
            this.socket.once('ready', () => {
                resolve();
            })            
            this.socket.once(ADHOCCAST.Dts.EClientSocketEvents.error, (error) => {
                reject(error);
            })               
            this.initEvents(this.socket);               
        })  
        this._connectPromise.then(() => {
            this._connectPromise = null;
        }).catch(() => {
            this._connectPromise = null;
        })
        return this._connectPromise;   

    }
    initEvents(socket: Redis.RedisClient) {
        socket.once("ready", (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connect, ...args)
        })
        socket.once("end", (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect, ...args);
            this.unInitEvents(socket);
        })
        socket.once("error", (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.message_error, ...args);
        })    
        socket.on('message', (channel: string, message: string) => {
            this.eventEmitter.emit('message', channel, message);            
        })    
    }    
    unInitEvents(socket: Redis.RedisClient) {
        socket && socket.removeAllListeners();
    }   

    disconnect() {
        this.socket && this.socket.quit();
    }

    sendCommand(cmd: any): Promise<any> {
        return Promise.resolve();
    }   

    getOptions(): Redis.ClientOpts {
        let url = this.getUrl() || "";
        url = url[url.length - 1] !== '/' ? url : url.substr(0, url.length - 1);  
        // let path = this.getPath();          

        let options: Redis.ClientOpts  = {
            max_attempts: 1,
            url: url
        }
        return options;
    }
    // getServerChannel(id: string): string {
    //     return 'path:' + this.getPath() + '/server:' + id;
    // }
    // getNamespaceChannel(id: string): string {
    //     return 'path:' + this.getPath() + '/namespace:' + id;
    // }
    // getRoomChannel(namespace: string, id: string): string {
    //     return this.getNamespaceChannel(namespace) + '/room:' + id;
    // }
    // getUserChannel(namespace: string, id: string): string {
    //     return this.getNamespaceChannel(namespace) + '/user:' + id;
    // }
    // getShortChannel(namespace: string, id: string): string {
    //     return this.getNamespaceChannel(namespace) + '/short:' + id;
    // }
    // getSocketChannel(namespace: string, id: string): string {
    //     return this.getNamespaceChannel(namespace) + '/socket:' + id;
    // }
}
