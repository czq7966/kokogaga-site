import * as io from 'socket.io-client'
import { EventEmitter } from 'events';
import { ECustomEvents, IUserQuery } from './user';

export enum EClientBaseEvents {
    connect = 'connect',
    connect_error = 'connect_error',
    connect_timeout = 'connect_timeout',
    connecting = 'connecting',
    disconnect = 'disconnect',
    error = 'error',
    reconnect = 'reconnect',
    reconnect_attempt = 'reconnect_attempt',
    reconnect_failed = 'reconnect_failed',
    reconnect_error = 'reconnect_error',
    reconnecting = 'reconnecting',
    // ping = 'ping',
    // pong = 'pong'
}

export class Client {
    eventEmitter: EventEmitter;
    socket: SocketIOClient.Socket;
    url: string;

    constructor(url?: string) {
        this.eventEmitter = new EventEmitter();
        this.url = url;   
    }
    destroy() {
        this.socket && this.socket.connected && this.socket.disconnect();
        delete this.eventEmitter;
        delete this.socket;
    }

    connect(url?: string): Promise<any> {
        if (this.socket && this.socket.connected) {
            return Promise.resolve()
        }
        return new Promise((resolve, reject) => {
            delete this.socket;
            this.url = url || this.url;
            this.socket = io(this.url, {autoConnect: false});        
            this.initEvents(this.socket);

            this.socket.on(EClientBaseEvents.connect, () => {
                resolve();
            })
            this.socket.on(EClientBaseEvents.connect_error, (error) => {
                reject(error);
            })            

            this.socket.connect();
        })      
    }

    initEvents(socket: SocketIOClient.Socket) {
        [EClientBaseEvents, ECustomEvents].forEach(events => {
            Object.keys(events).forEach(key => {
                let value = events[key];
                let _this = this;
                socket.on(value, function() {
                    console.log('Client Event:', value, arguments)
                    _this.eventEmitter.emit(value, arguments)
                })
            })
        })
    }    

    openRoom(query: IUserQuery): Promise<string> {
        return new Promise((resolve, reject) => {
            this.connect()
            .then(() => {
                this.socket.emit(ECustomEvents.openRoom, query, (result: boolean, msg: string) => {
                    if (result) {
                        console.log('open room success: ' + msg);
                        resolve(msg)                    
                    } else {
                        console.log('open room failed: ' + msg);
                        reject(msg)
                    }
                })  
            })
            .catch(error => {
                reject(error)
            })
 
        })
    }  

    joinRoom(query: IUserQuery): Promise<string> {
        return new Promise((resolve, reject) => {
            this.connect()
            .then(() => {
                this.socket.emit(ECustomEvents.joinRoom, query, (result: boolean, msg: string) => {
                    if (result) {
                        console.log('join room success: ' + msg);
                        resolve(msg)                    
                    } else {
                        console.log('join room failed: ' + msg);
                        reject(msg)
                    }
                })  
            })
            .catch(error => {
                reject(error)
            }) 
        })
    }

    leaveRoom(query: IUserQuery) {
        return new Promise((resolve, reject) => {
            this.connect()
            .then(() => {
                this.socket.emit(ECustomEvents.leaveRoom, query, (result: boolean, msg: string) => {
                    if (result) {
                        console.log('leave room success: ' + msg);
                        resolve(msg)                    
                    } else {
                        console.log('leave room failed: ' + msg);
                        reject(msg)
                    }
                })  
            })
            .catch(error => {
                reject(error)
            }) 
        })
    }    

    sendMessage(query: IUserQuery): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connect()
            .then(() => {
                this.socket.emit(ECustomEvents.message, query, (result: boolean, msg: string) => {
                    if (result) {
                        console.log('message success: ' + msg);
                        resolve(msg)                    
                    } else {
                        console.log('message failed: ' + msg);
                        reject(msg)
                    }
                })  
            })
            .catch(error => {
                reject(error)
            }) 
        })
    }    
}