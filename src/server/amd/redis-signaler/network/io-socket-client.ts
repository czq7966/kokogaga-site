
import * as IORedis from 'ioredis'
import * as Dts from '../dts'
import * as zlib from 'zlib'
import { EventEmitter } from 'events';
import { ADHOCCAST } from '../libex'
import { IClientSocket, ClientSocket } from './io-client-socket';

export interface IRedisClient {
    subscribe(channel: string): Promise<any>
    psubscribe(pchannel: string): Promise<any>
    unsubscribe(channel: string): Promise<any>
    publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any>
    publishBuffer(channel: string, buffer: Buffer): Promise<any>
    get(key: string): Promise<string>
    set(key: string, value: string): Promise<boolean>
    del(key: string): Promise<boolean>
    exists(key: string): Promise<boolean>
    hget(key: string, field: string): Promise<string>
    hset(key: string, field: string, value: string): Promise<boolean>
    hdel(key: string, field: string): Promise<boolean>
    hlen(key: string): Promise<number>
    hkeys(key: string): Promise<string[]>
    hexists(key: string, field: string): Promise<boolean>    
    persist(key: string): Promise<boolean> ;
    expire(key: string, seconds: number): Promise<boolean>     
    pexpire(key: string, milliseconds: number): Promise<boolean>   
    submulti(args?: Array<Array<string | number>>): IORedis.Pipeline;  
    pubmulti(args?: Array<Array<string | number>>): IORedis.Pipeline;
    submultiAsync(args: Array<Array<string | number>>): Promise<any[]>;  
    pubmultiAsync(args: Array<Array<string | number>>): Promise<any[]>;  
    eval(script: string, numKeys: number, ...args: IORedis.ValueType[]): Promise<any>
    redisconfig(...args: string[]): Promise<any>
}

export interface ISocketClient extends ADHOCCAST.Network.ISignaler, IRedisClient  {
    subSocket: IClientSocket
    pubSocket: IClientSocket
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string): string    
    sendCommand(cmd: any, channel?: string): Promise<any>
    delaySendCommand(cmd: any, channel?: string, delayTime?: number): Promise<any>
    onGetCmdChannel: (cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string) => string
    onGetSocketNodes: (clientSocket: IClientSocket) => IORedis.RedisOptions[]
    onGetSocketOptions: (clientSocket: IClientSocket) => IORedis.RedisOptions
    processPromise<T>(promise: Promise<any>): Promise<T>
}

export class SocketClient implements ISocketClient {
    static SignalerName: string = "adhoc-cast-connection:network:redis:socketclient";
    eventEmitter: EventEmitter;
    subSocket: IClientSocket
    pubSocket: IClientSocket
    onGetCmdChannel: (cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string) => string;
    onGetSocketNodes: (clientSocket: IClientSocket) => IORedis.RedisOptions[]
    onGetSocketOptions: (clientSocket: IClientSocket) => IORedis.RedisOptions

    constructor(url?: string) {
        this.eventEmitter = new EventEmitter();
        this.subSocket = new ClientSocket(url);
        this.pubSocket = new ClientSocket(url);       
        this.initEvents();         
    }
    destroy() {
        this.unInitEvents();
        this.eventEmitter.removeAllListeners();
        this.subSocket.destroy();
        this.pubSocket.destroy();
        delete this.subSocket;
        delete this.pubSocket;
    }

    id(): string {
        return this.subSocket.id();
    }
    getUrl(): string {
        return this.subSocket.getUrl();
    }
    setUrl(value: string, path?: string) {
        this.subSocket.setUrl(value, path);
        this.pubSocket.setUrl(value, path);
    }
    getSocketNodes(clientSocket: IClientSocket): IORedis.RedisOptions[] {
        if (this.onGetSocketNodes) return this.onGetSocketNodes(clientSocket)
        //

        let nodes: IORedis.RedisOptions[]  = []
        return nodes;        
    }  
    getSocketOptions(clientSocket: IClientSocket): IORedis.RedisOptions {
        if (this.onGetSocketOptions) return this.onGetSocketOptions(clientSocket)
        //

        let options: IORedis.RedisOptions  = {
        }
        return options;        
    }  

    connected(label?: string): boolean {
        let result = this.subSocket.connected() && this.pubSocket.connected();
        if (!result) {
            Logging.warn('assertConnected: redis server not connected: ' + label)
        }
        return result;
    }
    connecting(): boolean {
        return this.subSocket.connecting() || this.pubSocket.connecting();
    }
    async assertConnected(label: string) {
        if (!this.connected(label)) {
            throw label + ':assertConnected: redis server not connected';
        }
    }
    connect(url?: string, path?: string): Promise<any> {
        let subConnect = (this.subSocket as any).connect(url, path);
        let pubConnect = (this.pubSocket as any).connect(url, path);
        return Promise.all([subConnect, pubConnect]);
    }
    initEvents() {
        this.subSocket.onGetOptions = this.getSocketOptions.bind(this);
        this.pubSocket.onGetOptions = this.getSocketOptions.bind(this);
        this.subSocket.onGetNodes = this.getSocketNodes.bind(this);
        this.pubSocket.onGetNodes = this.getSocketNodes.bind(this);
        //Pub Events
        let connectEventEmitted = false;
        let disconnectEventEmitted = false;
        this.pubSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.connect, (...args) => {
            if (this.subSocket.connected()) {
                if (!connectEventEmitted) {
                    this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connect, ...args)
                    connectEventEmitted = true;
                    disconnectEventEmitted = false;
                }
            }
        });
        this.pubSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.disconnect, (...args) => {
            if (!disconnectEventEmitted) {
                this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect, ...args);
                disconnectEventEmitted = true;
                connectEventEmitted = false;
            }         
        })        
        this.pubSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.message_error, (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.message_error, ...args)
        })   

        //Sub Events
        this.subSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.connect, (...args) => {
            if (this.pubSocket.connected()) {
                if (!connectEventEmitted) {
                    this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connect, ...args)
                    connectEventEmitted = true;
                    disconnectEventEmitted = false;
                }              
            }
        });        
        this.subSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.disconnect, (...args) => {
            if (!disconnectEventEmitted) {
                this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect, ...args);
                disconnectEventEmitted = true;
                connectEventEmitted = false;
            }
        });                
        this.subSocket.eventEmitter.on('message', (channel: string, message: string) => {
            // let data: ADHOCCAST.Cmds.ICommandData<any> = JSON.parse(message);
            // Logging.log('/message', channel, data)            
            // this.eventEmitter.emit(ADHOCCAST.Dts.CommandID, data);            
        });
        this.subSocket.eventEmitter.on('messageBuffer', (channelBuf: Buffer, messageBuf: Buffer) => {
            let message: string;
            let channel: string;
            zlib.unzip(messageBuf, (err,  res) => {
                if (err) {
                    message = messageBuf.toString();
                }
                else {
                    message = res.toString();
                }
                channel = channelBuf.toString()
                let data: ADHOCCAST.Cmds.ICommandData<any> = JSON.parse(message);
                Logging.log('/messageBuffer', channel, data)            
                this.eventEmitter.emit(ADHOCCAST.Dts.CommandID, data);                
            })
           
        });
        this.subSocket.eventEmitter.on('pmessage', (pattern: string, channel: string, message: string) => {
            let data: ADHOCCAST.Cmds.ICommandData<Dts.IKeyspaceEvents> = {
                cmdId: Dts.ECommandId.signal_center_pmessage,
                props: {
                    pattern: pattern,
                    channel: channel,
                    message: message
                }
            };
            Logging.log('/pmessage', channel, data)            
            this.eventEmitter.emit(ADHOCCAST.Dts.CommandID, data);            
        });
        this.subSocket.eventEmitter.on('+node', (node: IORedis.Redis, clientSocket: IClientSocket) => {
            let data: ADHOCCAST.Cmds.ICommandData<Dts.IRedisNode> = {
                cmdId: Dts.ECommandId.signal_center_redis_node_add,
                props: {
                    clientSocket: clientSocket,
                    node: node,
                    type: 'sub'
                }
            };
            this.eventEmitter.emit(ADHOCCAST.Dts.CommandID, data);            
        });
    }    
    unInitEvents() {        
        this.subSocket.eventEmitter.removeAllListeners();
        this.pubSocket.eventEmitter.removeAllListeners();

        this.subSocket.onGetOptions = null;
        this.pubSocket.onGetOptions = null;
        this.subSocket.onGetNodes = null;
        this.pubSocket.onGetNodes = null;
    }   

    disconnect() {
        this.subSocket.disconnect();
        this.pubSocket.disconnect();
    }

    processPromise<T>(promise: Promise<any>): Promise<T> {
        return new Promise((resolve, reject) => {
            promise.then(v => {
                resolve(v as T)
            })
            .catch(e => {
                Logging.error(e.message);
                resolve()    
            })
        })
    }
    subscribe(channel: string): Promise<any> {
        return this.processPromise(this.subSocket.socket.subscribe(channel))
    }
    psubscribe(pchannel: string): Promise<any> {
        return this.processPromise(this.subSocket.socket.psubscribe(pchannel))        
    }
    unsubscribe(channel: string): Promise<any> {
        return this.processPromise(this.subSocket.socket.unsubscribe(channel))
    }
    publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            let msg = JSON.stringify(cmd);
            let promise: Promise<any>;
            zlib.gzip(msg, (err, buffer) => {
                if (err) {
                    promise = this.processPromise(this.pubSocket.socket.publish(channel, msg))
                } else {
                    promise = this.publishBuffer(channel, buffer)
                }
                promise.then(v => {
                    resolve(v)
                })
                .catch(e => {
                    reject(e)
                })
            })
        })
    }
    publishBuffer(channel: string, buffer: Buffer): Promise<any> {
        return this.processPromise(this.pubSocket.socket.publishBuffer(channel, buffer))
    }
    get(key: string): Promise<string> {
        return this.processPromise(this.pubSocket.socket.get(key))
    }
    set(key: string, value: string): Promise<boolean> {
        return this.processPromise(this.pubSocket.socket.set(key, value))
    }
    del(key: string): Promise<boolean> {
        return this.processPromise(this.pubSocket.socket.del(key))
    }
    exists(key: string): Promise<boolean> {  
        return this.processPromise(this.pubSocket.socket.exists(key))
    }
    hget(key: string, field: string): Promise<string> {
        return this.processPromise(this.pubSocket.socket.hget(key, field))
    }
    hset(key: string, field: string, value: string): Promise<boolean> {
        return this.processPromise(this.pubSocket.socket.hset(key, field, value))
    }
    hdel(key: string, field: string): Promise<boolean> {
        return this.processPromise(this.pubSocket.socket.hdel(key, field))
    }
    hlen(key: string): Promise<number> {
        return this.processPromise(this.pubSocket.socket.hlen(key))
    }
    hkeys(key: string): Promise<string[]> {
        return this.processPromise(this.pubSocket.socket.hkeys(key))
    }
    hexists(key: string, field: string): Promise<boolean> {  
        return this.processPromise(this.pubSocket.socket.hexists(key, field))
    }    
    persist(key: string): Promise<boolean> {
        return this.processPromise(this.pubSocket.socket.persist(key))
    }
    expire(key: string, seconds: number): Promise<boolean>  {
        return this.processPromise(this.pubSocket.socket.expire(key, seconds))
    }
    pexpire(key: string, milliseconds: number): Promise<boolean> {
        return this.processPromise(this.pubSocket.socket.pexpire(key, milliseconds))        
    }
    submulti(args?: Array<Array<string>>): IORedis.Pipeline {
        return this.subSocket.socket.multi(args)
    }
    pubmulti(args?: Array<Array<string>>): IORedis.Pipeline {  
        return this.pubSocket.socket.multi(args)
    }
    submultiAsync(args: Array<Array<string>>): Promise<any[]> {
        return this.processPromise(this.subSocket.socket.multi(args).exec())
    } 
    pubmultiAsync(args: Array<Array<string>>): Promise<any[]>{
        return this.processPromise(this.pubSocket.socket.multi(args).exec())
    }
    eval(script: string, numKeys: number, ...args: IORedis.ValueType[]): Promise<any> {
        return this.processPromise(this.pubSocket.socket.eval(script, numKeys, ...args))
    }
    redisconfig(...args: any[]): Promise<any> {
        return this.processPromise((this.pubSocket.socket.config as any)(...args))
    }   
    sendCommand(cmd: ADHOCCAST.Cmds.ICommandData<any>, channel?: string): Promise<any> {
        channel = channel || this.getCmdChannel(cmd);      
        return this.publish(channel, cmd);
    }   
    delaySendCommand(cmd: any, channel?: string, delayTime?: number): Promise<any> {
        if (delayTime && delayTime > 0) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.sendCommand(cmd, channel)
                    .then(v => resolve(v))
                    .catch(e => reject(e))                    
                }, delayTime);
            })
            
        } else {
            return this.sendCommand(cmd, channel)
        }

    }
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string): string {
        if (this.onGetCmdChannel)
            return this.onGetCmdChannel(cmd, namespace);
        return;
    }
}

ADHOCCAST.Network.SignalerFactory.register(SocketClient.SignalerName, SocketClient);
