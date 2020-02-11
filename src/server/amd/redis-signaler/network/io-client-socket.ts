
import { EventEmitter } from 'events';
import IORedis = require('ioredis');
import { ADHOCCAST } from '../libex'


export interface IRedisSocket extends IORedis.Redis {
    id?: string
}

export interface IClientSocket extends ADHOCCAST.Network.ISignaler {
    onGetNodes: (clientSocket: IClientSocket) => IORedis.RedisOptions[]
    onGetOptions: (clientSocket: IClientSocket) => IORedis.RedisOptions
    socket: IRedisSocket
}

export class ClientSocket implements IClientSocket {
    onGetNodes: (clientSocket: IClientSocket) => IORedis.RedisOptions[]
    onGetOptions: (clientSocket: IClientSocket) => IORedis.RedisOptions
    socket: IRedisSocket
    eventEmitter: EventEmitter;
    _url: string;

    constructor(url?: string) {
        this.eventEmitter = new EventEmitter();
        this._url = url;   
    }
    destroy() {
        this.eventEmitter.removeAllListeners();
        this.connected() && this.socket.disconnect();
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
        return this.socket && (this.socket.status == 'ready' || this.socket.status == 'connect')
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
            let nodes = this.getNodes();
            let options = this.getOptions();
            if (nodes.length > 1) {
                this.socket = new IORedis.Cluster(nodes, options) as any 
            } else {
                let node = Object.assign(nodes[0], options)
                this.socket = new IORedis(node)
            }
            this.socket.id = ADHOCCAST.Cmds.Common.Helper.uuid();
            // this.socket.once(ADHOCCAST.Dts.EClientSocketEvents.connect, () => {
 
            // })
            this.socket.once('ready', () => {
                resolve();
            })            
            // this.socket.once(ADHOCCAST.Dts.EClientSocketEvents.error, (error) => {
            //     reject(error);
            // })   
            this.initEvents(this.socket);                          
        })  
        this._connectPromise.then(() => {
            this._connectPromise = null;
        }).catch(() => {
            this._connectPromise = null;
        })
        return this._connectPromise;   

    }
    initEvents(socket: IRedisSocket) {
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
        socket.on('pmessage', (pattern: string, channel: string, message: string) => {
            this.eventEmitter.emit('pmessage', pattern, channel, message);            
        })    
    }    
    unInitEvents(socket: IRedisSocket) {
        socket && socket.removeAllListeners();
    }   

    disconnect() {
        this.unInitEvents(this.socket);
        this.socket && this.socket.quit();
    }

    sendCommand(cmd: any): Promise<any> {
        return Promise.resolve();
    }   

    getNodes(): IORedis.RedisOptions[]{
        if (this.onGetNodes) return this.onGetNodes(this);

        return [{}]
    }
    getOptions(): IORedis.RedisOptions {
        let options: IORedis.RedisOptions = {}
        if (this.onGetOptions) 
            options =  JSON.parse(JSON.stringify(this.onGetOptions(this)));
        
        options.retryStrategy = this.retryStrategy;
        // (options as any).clusterRetryStrategy = this.retryStrategy;
        return options;
    }
    _disconnected: boolean;
    _retryStartTime: number;
    retryStrategy = (times: number, err?: Error) => {
        if (times == 1) {
            this._disconnected = false;                
            this._retryStartTime = new Date().valueOf();
        }

        if (!this._disconnected) {
            let currTime = new Date().valueOf();
            let options = this.getOptions();
            let maxRetriesPerRequest = options.maxRetriesPerRequest || 20
            let timeout = currTime - this._retryStartTime;
            if (timeout > maxRetriesPerRequest * 1000) {
                this._disconnected = true;
                this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect);
            }
           
        }
        console.log('redis reconnecting', times)
        return 100
    }
}
