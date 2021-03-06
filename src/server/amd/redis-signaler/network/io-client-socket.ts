
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
    on_connect: (...args) => void
    on_ready: (...args) => void
    on_end: (...args) => void
    on_error: (...args) => void
    on_message: (channel: string, message: string) => void
    on_message_buffer: (channel: Buffer, message: Buffer) => void
    on_pmessage: (pattern: string, channel: string, message: string) => void
    on_pmessage_buffer: (pattern: Buffer, channel: Buffer, message: Buffer) => void
    on_node_add: (node: IORedis.Redis) => void
    on_node_del: (node: IORedis.Redis) => void
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
        return this.socket && (this.socket.status == 'ready')
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
        socket.on("connect", this.on_connect)        
        socket.on("ready", this.on_ready)
        socket.on("end", this.on_end)
        socket.on("error", this.on_error)    
        socket.on('message', this.on_message)  
        socket.on('messageBuffer', this.on_message_buffer) 
        socket.on('pmessage', this.on_pmessage)  
        socket.on('pmessageBuffer', this.on_pmessage_buffer) 
        socket.on('+node', this.on_node_add) 
        socket.on('-node', this.on_node_del)  
    }    
    unInitEvents(socket: IRedisSocket) {
        if (socket) {
            socket.removeAllListeners();
            let cluster = socket as any as IORedis.Cluster;
            if (cluster.nodes ) {
                cluster.nodes().forEach(node => {
                    node.removeAllListeners()                    
                });
            }
        }
    }   

    disconnect() {
        this.unInitEvents(this.socket);
        this.socket && this.socket.quit();
    }

    sendCommand(cmd: any): Promise<any> {
        return Promise.resolve();
    }   

    getNodes(): IORedis.RedisOptions[]{
        let nodes;
        if (this.onGetNodes) 
            nodes = this.onGetNodes(this);        
        
        nodes = nodes ? nodes : [{}];
        nodes = JSON.parse(JSON.stringify(nodes));
        return nodes;
    }
    getOptions(): IORedis.RedisOptions {
        let options: IORedis.RedisOptions = {}
        if (this.onGetOptions) 
            options =  JSON.parse(JSON.stringify(this.onGetOptions(this)));
        
        options.retryStrategy = this.retryStrategy;
        (options as any).clusterRetryStrategy = this.retryStrategy;
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
            let timeout = (options.maxRetriesPerRequest || 20) * 2 * 1000
            let retryTime = currTime - this._retryStartTime;
            if (retryTime > timeout) {
                this._disconnected = true;
                this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect);
            }
           
        }
        console.log('redis reconnecting', times)
        return 100
    }

    //node events
    on_connect = (...args) => {

    }
    on_ready = (...args) => {
        this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connect, ...args)
    }
    on_end = (...args) => {
        this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect, ...args);
    }
    on_error = (...args) => {
        this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.message_error, ...args);
    }
    on_message = (channel: string, message: string) => {
        this.eventEmitter.emit('message', channel, message);  
    }
    on_message_buffer = (channel: Buffer, message: Buffer) => {
        this.eventEmitter.emit('messageBuffer', channel, message); 
    }
    on_pmessage = (pattern: string, channel: string, message: string) => {
        this.eventEmitter.emit('pmessage', pattern, channel, message); 
    }
    on_pmessage_buffer = (pattern: Buffer, channel: Buffer, message: Buffer) => {
        this.eventEmitter.emit('pmessageBuffer', pattern, channel, message);
    }
    on_node_add = (node: IORedis.Redis) => {
        this.eventEmitter.emit('+node', node, this); 
    }
    on_node_del = (node: IORedis.Redis) => {
        this.eventEmitter.emit('-node', node, this);       
    }
}
