
import * as Redis from 'redis'
import { EventEmitter } from 'events';
import { ADHOCCAST } from '../libex'
import { IClientSocket, ClientSocket } from './client-socket';

export interface IRedisClient {
    subscribe(channel: string): Promise<any>
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
    hexists(key: string, field: string): Promise<boolean>    
    persist(key: string): Promise<boolean> ;
    expire(key: string, seconds: number): Promise<boolean>     
    pexpire(key: string, milliseconds: number): Promise<boolean>     
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

    connected(): boolean {
        return this.subSocket.connected() && this.pubSocket.connected();
    }
    connecting(): boolean {
        return this.subSocket.connecting() || this.pubSocket.connecting();
    }
    async assertConnected(label: string) {
        if (!this.connected()) {
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
            if (this.connected()) {
                this.subSocket.socket.subscribe(channel,  (err: Error, result: string) => {
                    if (err)
                        reject(err.message);
                    else {
                        Logging.log('/subscribe', channel);                        
                        resolve(result)    
                    }
                })
    
            } else {
                reject('/subscribe:' + channel + ': redis server not connected ')
            }    
        });
    }
    unsubscribe(channel: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.connected()) {
                this.subSocket.socket.unsubscribe(channel,  (err: Error, result: string) => {
                    if (err)
                        reject(err.message);
                    else {
                        Logging.log('/unsubscribe', channel);    
                        resolve(result)    
                    }
                })
    
            } else {
                reject('/unsubscribe' + channel + ': : redis server not connected')
            }    
        });        
    }
    publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any> {
        if (!channel) {
            return Promise.reject("/publish: channel is null ")
        }
        return new Promise((resolve, reject) => {
            if (this.connected()) {
                Logging.log('/publish', channel, cmd);
                let msg = JSON.stringify(cmd);                
                this.pubSocket.socket.publish(channel, msg, (err: Error, recvCount: number) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(recvCount)    
                    }
                })
    
            } else {
                reject('/publish:' + channel + ':  redis server not connected')
            }    
        });
    }
    get(key: string): Promise<string> {
        return new Promise((resolve, reject) => {            
            this.assertConnected('get').then(v => {
                this.pubSocket.socket.get(key,  (err: Error, value: string) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(value)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }
    set(key: string, value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {            
            this.assertConnected('set').then(v => {
                this.pubSocket.socket.set(key, value, (err: Error, value: string) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(true)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }
    del(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {            
            this.assertConnected('del').then(v => {
                this.pubSocket.socket.del(key, (err: Error, value: number) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(true)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }
    exists(key: string): Promise<boolean> {        
        return new Promise((resolve, reject) => {            
            this.assertConnected('exists').then(v => {
                this.pubSocket.socket.exists(key, (err: Error, value: number) => {
                    if (err)
                        resolve(false)
                    else {
                        resolve(value > 0)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }
    hget(key: string, field: string): Promise<string> {
        return new Promise((resolve, reject) => {            
            this.assertConnected('hget').then(v => {
                this.pubSocket.socket.hget(key, field,  (err: Error, value: string) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(value)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }
    hset(key: string, field: string, value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {            
            this.assertConnected('hset').then(v => {
                this.pubSocket.socket.hset(key, field, value, (err: Error, value: number) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(true)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }
    hdel(key: string, field: string): Promise<boolean> {
        return new Promise((resolve, reject) => {            
            this.assertConnected('hdel').then(v => {
                this.pubSocket.socket.hdel(key, field,  (err: Error, value: number) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(true)    
                    }
                })
            }).catch(e => {reject(e)})
        });         
    }
    hlen(key: string): Promise<number> {
        return new Promise((resolve, reject) => {            
            this.assertConnected('hlen').then(v => {
                this.pubSocket.socket.hlen(key,  (err: Error, value: number) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(value)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }
    hexists(key: string, field: string): Promise<boolean> {  
        return new Promise((resolve, reject) => {            
            this.assertConnected('hexists').then(v => {
                this.pubSocket.socket.hexists(key, field, (err: Error, value: number) => {
                    if (err)
                        resolve(false)
                    else {
                        resolve(value > 0)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }    
    persist(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {            
            this.assertConnected('persist').then(v => {
                this.pubSocket.socket.persist(key, (err: Error, value: number) => {
                    if (err)
                        reject(err.message)
                    else {
                        resolve(true)    
                    }
                })
            }).catch(e => {reject(e)})
        }); 
    }
    expire(key: string, seconds: number): Promise<boolean>  {
        return new Promise((resolve, reject) => {            
            this.assertConnected('expire').then(v => {
                this.pubSocket.socket.expire(key, seconds, (err: Error, value: number) => {
                    if (err)
                        reject(err.message)
                    else {
                        resolve(true)    
                    }
                })
            }).catch(e => {reject(e)})
        });   
    }
    pexpire(key: string, milliseconds: number): Promise<boolean> {        
        return new Promise((resolve, reject) => {            
            this.assertConnected('pexpire').then(v => {
                this.pubSocket.socket.pexpire(key, milliseconds, (err: Error, value: number) => {
                    if (err)
                        reject(err.message)
                    else {
                        resolve(true)    
                    }
                })
            }).catch(e => {reject(e)})
        });         
    }
    eval() {
        this.pubSocket.socket.eval()
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
