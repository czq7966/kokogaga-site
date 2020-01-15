
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
    // getCmdNamespace(cmd: ADHOCCAST.Cmds.ICommandData<any>): string
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string): string
    onGetCmdChannel: (cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string) => string;    
    // getServerChannel(id: string): string
    // getRoomChannel(namespace: string, id: string): string
    // getUserChannel(namespace: string, id: string): string
    // getShortChannel(namespace: string, id: string): string
    // getSocketChannel(namespace: string, id: string): string    
    sendCommand(cmd: any, channel?: string): Promise<any>
    delaySendCommand(cmd: any, channel?: string, delayTime?: number): Promise<any>


}

export class SocketClient implements ISocketClient {
    static SignalerName: string = "adhoc-cast-connection:network:redis:socketclient";
    eventEmitter: EventEmitter;
    subSocket: IClientSocket
    pubSocket: IClientSocket
    onGetCmdChannel: (cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string) => string;

    constructor(url?: string, path?: string) {
        this.eventEmitter = new EventEmitter();
        this.subSocket = new ClientSocket(url, path);
        this.pubSocket = new ClientSocket(url, path);       
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
    // getPath(): string {
    //     return this.subSocket.getPath();
    // }
    // setPath(value: string) {
    //     this.subSocket.setPath(value);
    //     this.pubSocket.setPath(value);
    // }    

    connected(): boolean {
        return this.subSocket.connected() && this.pubSocket.connected();
    }
    connecting(): boolean {
        return this.subSocket.connecting() || this.pubSocket.connecting();
    }
    async assertConnected() {
        if (!this.connected()) {
            throw 'redis server not connected';
        }
    }
    connect(url?: string, path?: string): Promise<any> {
        let subConnect = (this.subSocket as any).connect(url, path);
        let pubConnect = (this.pubSocket as any).connect(url, path);
        return Promise.all([subConnect, pubConnect]);
    }
    initEvents() {
        this.subSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.connect, (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.connect, ...args)
        });
        this.subSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.disconnect, (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.disconnect, ...args)
        })        
        this.subSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.message_error, (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.message_error, ...args)
        })        
        this.subSocket.eventEmitter.on(ADHOCCAST.Dts.EClientSocketEvents.message_error, (...args) => {
            this.eventEmitter.emit(ADHOCCAST.Dts.EClientSocketEvents.message_error, ...args)
        });           
        this.subSocket.eventEmitter.on('message', (channel: string, message: string) => {
            let data: ADHOCCAST.Cmds.ICommandData<any> = JSON.parse(message);
            console.log('/message', channel, data)            
            this.eventEmitter.emit(ADHOCCAST.Dts.CommandID, data);            
        });
    }    
    unInitEvents() {
        this.subSocket.eventEmitter.removeAllListeners();
        this.pubSocket.eventEmitter.removeAllListeners();
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
                        console.log('/subscribe', channel);                        
                        resolve(result)    
                    }
                })
    
            } else {
                reject('redis server not connected')
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
                        console.log('/unsubscribe', channel);    
                        resolve(result)    
                    }
                })
    
            } else {
                reject('redis server not connected')
            }    
        });        
    }
    publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any> {
        if (!channel) {
            return Promise.reject("/publish: channel is null ")
        }
        return new Promise((resolve, reject) => {
            if (this.connected()) {
                console.log('/publish', channel, cmd);
                let msg = JSON.stringify(cmd);                
                this.pubSocket.socket.publish(channel, msg, (err: Error, recvCount: number) => {
                    if (err)
                        reject(err.message);
                    else {
                        resolve(recvCount)    
                    }
                })
    
            } else {
                reject('redis server not connected')
            }    
        });
    }
    get(key: string): Promise<string> {
        return new Promise((resolve, reject) => {            
            this.assertConnected().then(v => {
                this.subSocket.socket.get(key,  (err: Error, value: string) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.set(key, value, (err: Error, value: string) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.del(key, (err: Error, value: number) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.exists(key, (err: Error, value: number) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.hget(key, field,  (err: Error, value: string) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.hset(key, field, value, (err: Error, value: number) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.hdel(key, field,  (err: Error, value: number) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.hlen(key,  (err: Error, value: number) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.hexists(key, field, (err: Error, value: number) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.persist(key, (err: Error, value: number) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.expire(key, seconds, (err: Error, value: number) => {
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
            this.assertConnected().then(v => {
                this.subSocket.socket.pexpire(key, milliseconds, (err: Error, value: number) => {
                    if (err)
                        reject(err.message)
                    else {
                        resolve(true)    
                    }
                })
            }).catch(e => {reject(e)})
        });         
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
    // getCmdNamespace(cmd: ADHOCCAST.Cmds.ICommandData<any>): string {
    //     return cmd.extra && cmd.extra.props && cmd.extra.props.namespace || '';      
    // }
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string): string {
        if (this.onGetCmdChannel)
            return this.onGetCmdChannel(cmd, namespace);
        return;
        // namespace = namespace || this.getCmdNamespace(cmd) || '';
        // let channel: string;
        // switch (cmd.to.type) {
        //     case 'server':
        //         channel = this.getServerChannel(cmd.to.id);
        //         break;
        //     case 'room': 
        //         channel = this.getRoomChannel(namespace, cmd.to.id);
        //         break;
        //     case 'user':
        //         channel = this.getUserChannel(namespace, cmd.to.id);
        //         break;
        //     case 'socket':
        //         channel = this.getSocketChannel(namespace, cmd.to.id);
        //         break;
        // }  
        // return channel;      
    }

    // getServerChannel(id: string): string {
    //     return this.pubSocket.getServerChannel(id)
    // }
    // getRoomChannel(namespace: string, id: string): string {
    //     return this.pubSocket.getRoomChannel(namespace, id);
    // }
    // getUserChannel(namespace: string, id: string): string {
    //     return this.pubSocket.getUserChannel(namespace, id);
    // }
    // getShortChannel(namespace: string, id: string): string {
    //     return this.pubSocket.getShortChannel(namespace, id);
    // }    
    // getSocketChannel(namespace: string, id: string): string {
    //     return this.pubSocket.getSocketChannel(namespace, id);
    // }

}

ADHOCCAST.Network.SignalerFactory.register(SocketClient.SignalerName, SocketClient);
