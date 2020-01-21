
import { EventEmitter } from 'events';
import * as Redis from 'redis'

import { ADHOCCAST } from '../libex'

export interface IRedisSocket extends Redis.RedisClient {
    id?: string
}

export interface IClientSocket extends ADHOCCAST.Network.ISignaler {
    onGetOptions: (clientSocket: IClientSocket) => Redis.ClientOpts
    socket: IRedisSocket
}

export class ClientSocket implements IClientSocket {
    onGetOptions: (clientSocket: IClientSocket) => Redis.ClientOpts
    socket: IRedisSocket
    eventEmitter: EventEmitter;
    _url: string;

    constructor(url?: string) {
        this.eventEmitter = new EventEmitter();
        this._url = url;   
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
    setUrl(value: string) {
        this._url = value;
    }
    connected(): boolean {
        return this.socket && this.socket.connected
    }
    connecting(): boolean {
        return !!this._connectPromise;
    }

    _connectPromise: Promise<any>;
    connect(url?: string): Promise<any> {
        if (this.connected()) 
            return Promise.resolve();        
        if (this._connectPromise != null)
            return this._connectPromise;

        if (url) this.setUrl(url);
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
        socket.on("connect", (...args) => {

        })        
        socket.on("ready", (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connect, ...args)
        })
        socket.on("end", (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect, ...args);
            // this.unInitEvents(socket);
        })
        socket.on("error", (...args) => {            
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
        this.unInitEvents(this.socket);
        this.socket && this.socket.quit();
    }

    sendCommand(cmd: any): Promise<any> {
        return Promise.resolve();
    }   

    getOptions(): Redis.ClientOpts {
        if (this.onGetOptions) return this.onGetOptions(this);
        //
        let url = this.getUrl() || "";
        url = url[url.length - 1] !== '/' ? url : url.substr(0, url.length - 1);  

        let options: Redis.ClientOpts  = {
            max_attempts: 1,
            url: url
        }
        return options;
    }
}
