
import * as Redis from 'redis'
import * as Dts from '../dts'
import { EventEmitter } from 'events';
import { ADHOCCAST } from '../libex'
import { IClientSocket, ClientSocket } from './client-socket';

export interface IRedisClient {
    subscribe(channel: string): Promise<any>
    psubscribe(pchannel: string): Promise<any>
    unsubscribe(channel: string): Promise<any>
    publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any>
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
    submulti(args?: Array<Array<string | number>>): Redis.Multi;  
    pubmulti(args?: Array<Array<string | number>>): Redis.Multi;
    submultiAsync(args: Array<Array<string | number>>): Promise<any[]>;  
    pubmultiAsync(args: Array<Array<string | number>>): Promise<any[]>;  
    eval(...args: (string | number)[]): Promise<any>
    redisconfig(...args: string[]): Promise<any>
}

export interface ISocketClient extends ADHOCCAST.Network.ISignaler, IRedisClient  {
    subSocket: IClientSocket
    pubSocket: IClientSocket
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string): string    
    sendCommand(cmd: any, channel?: string): Promise<any>
    delaySendCommand(cmd: any, channel?: string, delayTime?: number): Promise<any>
    onGetCmdChannel: (cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string) => string
    onGetSocketOptions: (clientSocket: IClientSocket) => Redis.ClientOpts
}

export class SocketClient implements ISocketClient {
    static SignalerName: string = "adhoc-cast-connection:network:redis:socketclient";
    eventEmitter: EventEmitter;
    subSocket: IClientSocket
    pubSocket: IClientSocket
    onGetCmdChannel: (cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string) => string;
    onGetSocketOptions: (clientSocket: IClientSocket) => Redis.ClientOpts

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
    getSocketOptions(clientSocket: IClientSocket): Redis.ClientOpts {
        if (this.onGetSocketOptions) return this.onGetSocketOptions(clientSocket)
        //
        let url = this.getUrl() || "";
        url = url[url.length - 1] !== '/' ? url : url.substr(0, url.length - 1);  

        let options: Redis.ClientOpts  = {
            url: url,
            retry_strategy: (options: Redis.RetryStrategyOptions) => {
                return 1000;
            }
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
            let data: ADHOCCAST.Cmds.ICommandData<any> = JSON.parse(message);
            Logging.log('/message', channel, data)            
            this.eventEmitter.emit(ADHOCCAST.Dts.CommandID, data);            
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
    }    
    unInitEvents() {        
        this.subSocket.eventEmitter.removeAllListeners();
        this.pubSocket.eventEmitter.removeAllListeners();

        this.subSocket.onGetOptions = null;
        this.pubSocket.onGetOptions = null;
    }   

    disconnect() {
        this.subSocket.disconnect();
        this.pubSocket.disconnect();
    }

    subscribe(channel: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.connected('subscribe')) {
                this.subSocket.socket.subscribe(channel,  (err: Error, result: string) => {
                    if (err) {                        
                        Logging.error(err.message);
                        resolve(err.message);
                    }
                    else {
                        Logging.log('/subscribe', channel);                        
                        resolve(result)    
                    }
                })
    
            } else {
                let err = '/subscribe:' + channel + ': redis server not connected ';
                Logging.error(err);
                resolve(err)
            }    
        });
    }
    psubscribe(pchannel: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.connected('psubscribe')) resolve()
            else {
                this.subSocket.socket.psubscribe(pchannel,  (err: Error, result: string) => {
                    if (err) {                        
                        Logging.error(err.message);
                        resolve(err.message);
                    }
                    else {
                        Logging.log('/psubscribe', pchannel);                        
                        resolve(result)    
                    }
                })
    
            }   
        });
    }
    unsubscribe(channel: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.connected('unsubscribe')) {
                this.subSocket.socket.unsubscribe(channel,  (err: Error, result: string) => {
                    if (err) {                        
                        Logging.error(err.message);
                        resolve(err.message);
                    }
                    else {
                        Logging.log('/unsubscribe', channel);    
                        resolve(result)    
                    }
                })
    
            } else {
                let err = '/unsubscribe:' + channel + ': redis server not connected ';
                Logging.error(err);
                resolve(err)                
            }    
        });        
    }
    publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any> {
        if (!channel) {
            return Promise.reject("/publish: channel is null ")
        }
        return new Promise((resolve, reject) => {
            if (this.connected('publish')) {
                Logging.log('/publish', channel, cmd);
                let msg = JSON.stringify(cmd);                
                this.pubSocket.socket.publish(channel, msg, (err: Error, recvCount: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(err.message);
                    }
                    else {
                        resolve(recvCount)    
                    }
                })    
            } else {
                let err = '/publish:' + channel + ': redis server not connected ';
                Logging.error(err);
                resolve(err)    
            }    
        });
    }
    get(key: string): Promise<string> {
        return new Promise((resolve, reject) => {            
            if (!this.connected('get')) resolve()
            else {
                this.pubSocket.socket.get(key,  (err: Error, value: string) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve();
                    }
                    else {
                        resolve(value)    
                    }
                })
            }
        }); 
    }
    set(key: string, value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {         
            if (!this.connected('set')) resolve(false)
            else {
                this.pubSocket.socket.set(key, value, (err: Error, value: string) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false);
                    }
                    else {
                        resolve(true)    
                    }
                })
            }
        }); 
    }
    del(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {   
            if (!this.connected('del')) resolve(false)
            else {
                this.pubSocket.socket.del(key, (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false);
                    }
                    else {
                        resolve(true)    
                    }
                })
            }                     
        }); 
    }
    exists(key: string): Promise<boolean> {        
        return new Promise((resolve, reject) => {            
            if (!this.connected('exists')) resolve(false)
            else {
                this.pubSocket.socket.exists(key, (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false)
                    }
                    else {
                        resolve(value > 0)    
                    }
                })
            }
        }); 
    }
    hget(key: string, field: string): Promise<string> {
        return new Promise((resolve, reject) => {            
            if (!this.connected('hget')) resolve()
            else {
                this.pubSocket.socket.hget(key, field,  (err: Error, value: string) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve();
                    }
                    else {
                        resolve(value)    
                    }
                })
            }
        }); 
    }
    hset(key: string, field: string, value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {            
            if (!this.connected('hset')) resolve()
            else {
                this.pubSocket.socket.hset(key, field, value, (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false);
                    }
                    else {
                        resolve(true)    
                    }
                })
            };
        }); 
    }
    hdel(key: string, field: string): Promise<boolean> {
        return new Promise((resolve, reject) => {            
            if (!this.connected('hdel')) resolve()
            else {
                this.pubSocket.socket.hdel(key, field,  (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false);
                    }
                    else {
                        resolve(true)    
                    }                    
                })
            }
        });         
    }
    hlen(key: string): Promise<number> {
        return new Promise((resolve, reject) => {            
            if (!this.connected('hlen')) resolve()
            else {
                this.pubSocket.socket.hlen(key,  (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve();
                    }
                    else {
                        resolve(value)    
                    }
                })
            }
        }); 
    }
    hkeys(key: string): Promise<string[]> {
        return new Promise((resolve, reject) => {            
            if (!this.connected('hkeys')) resolve()
            else {
                this.pubSocket.socket.hkeys(key,  (err: Error, value: string[]) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve();
                    }
                    else {
                        resolve(value)    
                    }
                })
            }
        });       
    }
    hexists(key: string, field: string): Promise<boolean> {  
        return new Promise((resolve, reject) => {            
            if (!this.connected('hexists')) resolve()
            else {
                this.pubSocket.socket.hexists(key, field, (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false)
                    }
                    else {
                        resolve(value > 0)    
                    }
                })
            }
        }); 
    }    
    persist(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {            
            if (!this.connected('persist')) resolve()
            else {
                this.pubSocket.socket.persist(key, (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false)
                    }
                    else {
                        resolve(value > 0)    
                    }
                })
            }
        }); 
    }
    expire(key: string, seconds: number): Promise<boolean>  {
        return new Promise((resolve, reject) => {            
            if (!this.connected('expire')) resolve()
            else {
                this.pubSocket.socket.expire(key, seconds, (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false)
                    }
                    else {
                        resolve(value > 0)    
                    }
                })
            }
        });   
    }
    pexpire(key: string, milliseconds: number): Promise<boolean> {        
        return new Promise((resolve, reject) => {            
            if (!this.connected('pexpire')) resolve()
            else {
                this.pubSocket.socket.pexpire(key, milliseconds, (err: Error, value: number) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(false)
                    }
                    else {
                        resolve(value > 0)    
                    }
                })
            }
        });         
    }
    submulti(args?: Array<Array<string | number>>): Redis.Multi {                    
        if (!this.connected('submulti')) return null
        else {
            return this.subSocket.socket.multi(args)
        }                
    }
    pubmulti(args?: Array<Array<string | number>>): Redis.Multi {                    
        if (!this.connected('pubmulti')) return null
        else {
            return this.pubSocket.socket.multi(args)
        }                
    }
    submultiAsync(args: Array<Array<string | number>>): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (!this.connected('submultiAsync')) resolve()
            else {
                this.subSocket.socket.multi(args).exec((err, result) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve()
                    }
                    else {
                        resolve(result)    
                    }
                })       
            }
        })
    } 
    pubmultiAsync(args: Array<Array<string | number>>): Promise<any[]>{
        return new Promise((resolve, reject) => {
            if (!this.connected('pubmultiAsync')) resolve()
            else {
                this.pubSocket.socket.multi(args).exec((err, result) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve()
                    }
                    else {
                        resolve(result)    
                    }
                })       
            }
        })
    }
    eval(...args: (string | number)[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.connected('eval')) resolve()
            else {
                this.pubSocket.socket.eval(...args, (err: Error, value: any) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(err.message)
                    }
                    else {
                        resolve(value)    
                    }
                })
            }
        })
    }
    redisconfig(...args: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.connected('redisconfig')) resolve()
            else {
                this.pubSocket.socket.config(...args, (err: Error, value: any) => {
                    if (err) {
                        Logging.error(err.message);
                        resolve(err.message)
                    }
                    else {
                        resolve(value)    
                    }
                })
            }
        })
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
