import { SocketUsers, ISocketNamespace } from "./users";
import * as Dts from "./dts";
// import { dispatcher } from "./cmds/index";
import { Debug } from "./helper";
import { Dispatcher } from "./dispatcher";

export enum EReservedEvents {
    error = 'error',
    connect = 'connect',
    disconnect = 'disconnect',
    disconnecting = 'disconnecting',
    // newListener = 'newListener',
    // removeListener = 'removeListener',
    ping = 'ping',
    pong = 'pong',
}

export enum ECustomEvents {
    message = 'room-message',
    openRoom = 'room-open',
    joinRoom = 'room-join',    
    closeRoom = 'room-close',
    leaveRoom = 'room-leave'
}

export interface IUserQuery {
    roomid?: string,
    password?: string,
    isOwner?: boolean,
    autoCreate?: boolean
    max?: number,
    from?: string,
    to?: string,
    msg?: any
}

export interface IUserSocket extends SocketIO.Socket {
    user?: SocketUser
}


export class SocketUser  {
    user: Dts.IUser;
    users: SocketUsers;
    socket: IUserSocket;
    dispatcher: Dispatcher;
    constructor(socket: IUserSocket) {
        this.dispatcher = Dispatcher.getInstance();
        this.socket = socket;
        this.socket.user = this;  
        this.users = (socket.nsp as ISocketNamespace).users;
        this.initEvents();          
    }

    destroy() {
        this.unInitEvents();
        delete this.users
        delete this.socket.user;
        delete this.socket;
        delete this.dispatcher;
    }

    initEvents() {
        this.socket.on(Dts.EServerSocketEvents.error, this.onError);
        this.socket.on(Dts.EServerSocketEvents.disconnecting, this.onDisconnecting);
        this.socket.on(Dts.EServerSocketEvents.disconnect, this.onDisconnect);
        this.socket.on(Dts.CommandID, this.onCommand);

        [EReservedEvents, ECustomEvents].forEach(events => {
            Object.keys(events).forEach(key => {
                let value = events[key];
                value != ECustomEvents.message &&
                this.socket.addListener(value, (...args: any[]) => {
                    console.log('ServerEvent', value, ...args ? args[0]: '')
                })
            })
        })
    }
    unInitEvents() {
        this.socket.removeAllListeners();        
    }



    // Network business
    onError = (err) => {
        console.error(err)
    }


    onDisconnecting = () => {
        if (this.isLogin()) {
            this.users.delSocketUser(this.user.id)
        } 
    }

    onDisconnect = () => {

    }    


    // Command business
    onCommand = (cmd: Dts.ICommandData, cb?: (result: boolean) => void) => {
        cb && cb(true)
        this.dispatcher.onCommand(cmd, this);

    }
    sendCommand = (cmd: Dts.ICommandData) => {
        cmd.from = cmd.from || {};
        cmd.from.type = cmd.from.type || 'server';
        cmd.from.id = cmd.from.id || '';

        switch(cmd.to.type) {
            case 'room':
                this.socket.to(cmd.to.id).emit(Dts.CommandID, cmd);
                break;
            case 'socket':
                if (this.socket.id === cmd.to.id || !cmd.to.id) {
                    this.socket.emit(Dts.CommandID, cmd);
                } else {
                    this.socket.to(cmd.to.id).emit(Dts.CommandID, cmd);
                }
                break
            default:
                this.socket.emit(Dts.CommandID, cmd);
                break;
        }
        console.log('SendCommand', cmd.cmdId, cmd.to.id)
    }

    // User business
    isLogin(): boolean {
        return !!(this.user && this.users.users.exist(this.user.id))
    }
    isAgency(): Boolean {
        let label = this.user && this.user.label || 0;
        return (label & Dts.EUserLabel.agency) === Dts.EUserLabel.agency;
    }
    isStreamReceiver(): Boolean {
        let label = this.user && this.user.label || 0;
        return (label & Dts.EUserLabel.streamReceiver) === Dts.EUserLabel.streamReceiver;
    }   
    isStreamSender(): boolean {
        let label = this.user && this.user.label || 0;
        return (label & Dts.EUserLabel.streamSender) === Dts.EUserLabel.streamSender;        
    } 

    // createRoomId(): string {
    //     let roomid = Math.floor(Math.random() * 100000).toString();
    //     if(this.socket.adapter.rooms[roomid]) {
    //         roomid = this.createRoomId();
    //     }
    //     return roomid;

    // }    
    // onOpenRoom = (query: IUserQuery, callback?: (result: boolean, msg?: any) => void) => {
    //     query.roomid = query.roomid || this.createRoomId();
    //     let room = this.socket.adapter.rooms[query.roomid];
    //     if (room) {
    //         callback && callback(false, 'Connection id already exists: ' + query.roomid);
    //     } else {
    //         this.socket.join(query.roomid);
    //         this.query = Object.assign({}, query);
    //         this.query.isOwner = true;
    //         this.socket.user = this;
    //         callback && callback(true, query);
    //     }
    // }
    // onCloseRoom = (query: IUserQuery, callback?: (result: boolean, msg?: string) => void) => {
    //     let room = this.socket.adapter.rooms[query.roomid];
    //     if (room) {
    //         query.from = query.from || this.socket.id;
    //         this.socket.to(query.roomid).emit(ECustomEvents.closeRoom, query);            
    //         Object.keys(room.sockets).forEach(sid => {
    //             let socket = this.socket.nsp.sockets[sid];
    //             socket && socket.leave(query.roomid);
    //         })
    //     }
    //     room = this.socket.adapter.rooms[query.roomid];
    //     if(room) {
    //         callback && callback(false, 'Connection close failed: ' + query.roomid + ', length ' + room.length);
    //     } else {
    //         callback && callback(true);
    //     }
    // }
    // onJoinRoom = (query: IUserQuery, callback?: (result: boolean, msg?: string) => void) => {
    //     let room = this.socket.adapter.rooms[query.roomid];
    //     if (room) {
    //         query.from = query.from || this.socket.id;
    //         this.socket.join(query.roomid);
    //         this.query = Object.assign(query);
    //         this.socket.to(query.roomid).emit(ECustomEvents.joinRoom, query);
    //         callback && callback(true);
    //     } else  {
    //         callback && callback(false, 'Connection id not exist: ' + query.roomid);
    //     }
    // }
    // onLeaveRoom = (query: IUserQuery, callback?: (result: boolean, msg?: string) => void) => {      
    //     if (this.query.isOwner) {
    //         this.onCloseRoom(query, callback)
    //     } else {
    //         let room = this.socket.rooms[query.roomid];
    //         if (room) {
    //             query.from = query.from || this.socket.id;
    //             this.socket.to(query.roomid).emit(ECustomEvents.leaveRoom, query);
    //             this.socket.leave(query.roomid);            
    //         } 
    //         callback && callback(true);        
    //     }
    // }
}