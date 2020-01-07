
import { EventEmitter } from 'events';
import * as Redis from 'redis'

import { ADHOCCAST } from '../libex'
import { IClientSocket, ClientSocket } from './client-socket';

export interface ISocketClient extends ADHOCCAST.Network.ISignaler {
    subSocket: IClientSocket
    pubSocket: IClientSocket
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>): string
}

export class SocketClient implements ISocketClient {
    static SignalerName: string = "adhoc-cast-connection:network:redis:socketclient";
    eventEmitter: EventEmitter;
    subSocket: IClientSocket
    pubSocket: IClientSocket

    constructor(url?: string, path?: string) {
        this.eventEmitter = new EventEmitter();
        this.subSocket = new ClientSocket(url, path);
        this.pubSocket = new ClientSocket(url, path);                
    }
    destroy() {
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
    getPath(): string {
        return this.subSocket.getPath();
    }
    setPath(value: string) {
        this.subSocket.setPath(value);
        this.pubSocket.setPath(value);
    }    

    connected(): boolean {
        return this.subSocket.connected() && this.pubSocket.connected();
    }
    connecting(): boolean {
        return this.subSocket.connecting() || this.pubSocket.connecting();
    }

    connect(url?: string, path?: string): Promise<any> {
        let subConnect = (this.subSocket as any).connect(url, path);
        let pubConnect = (this.pubSocket as any).connect(url, path);
        return Promise.all([subConnect, pubConnect]);
    }
    initEvents(socket: Redis.RedisClient) {
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
            this.eventEmitter.emit(ADHOCCAST.Dts.CommandID, data);            
        });
    }    
    unInitEvents(socket: Redis.RedisClient) {
        this.subSocket.eventEmitter.removeAllListeners();
        this.pubSocket.eventEmitter.removeAllListeners();
    }   

    disconnect() {
        this.subSocket.disconnect();
        this.pubSocket.disconnect();
    }

    sendCommand(cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            let channel = this.getCmdChannel(cmd);            
            let value = JSON.stringify(cmd);
            this.pubSocket.socket.publish(channel, value, (err: Error, recvCount: number) => {
                if (err)
                    reject(err.message);
                else 
                    resolve(recvCount)    
            }) 
        })
    }   
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>): string {
        let channel: string;
        switch (cmd.to.type) {
            case 'server':
                channel = this.pubSocket.getServerChannel(cmd.to.id);
                break;
            case 'room': 
                channel = this.pubSocket.getRoomChannel(cmd.to.id);
                break;
            case 'user':
                channel = this.pubSocket.getServerChannel(cmd.to.id);
                break;
            case 'socket':
                channel = this.pubSocket.getServerChannel(cmd.to.id);
                break;
        }  
        return channel;      
    }

}

ADHOCCAST.Network.SignalerFactory.register(SocketClient.SignalerName, SocketClient);
