import { SocketUsers, ISocketNamespace } from "./users";
import * as Dts from "../dts";
import * as Cmds from "../cmds/index";
import * as Services from '../services/index'


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


export class SocketUser  extends Cmds.Common.Base {
    user: Dts.IUser;
    users: SocketUsers;
    socket: IUserSocket;
    dispatcher: Services.Dispatcher;
    openRooms: Cmds.Common.Helper.KeyValue<boolean>;
    constructor(socket: IUserSocket) {
        super()
        this.dispatcher = Services.Dispatcher.getInstance(Dts.dispatcherInstanceName);
        this.socket = socket;
        this.socket.user = this;  
        this.users = (socket.nsp as ISocketNamespace).users;
        this.openRooms = new Cmds.Common.Helper.KeyValue<any>();
        this.initEvents();          
    }

    destroy() {
        this.unInitEvents();
        delete this.openRooms;
        delete this.user
        delete this.users
        delete this.socket.user;
        delete this.socket;
        delete this.dispatcher;
    }

    initEvents() {
        // this.socket.on(Dts.EServerSocketEvents.error, this.onError);
        // this.socket.on(Dts.EServerSocketEvents.disconnecting, this.onDisconnecting);
        this.socket.on(Dts.CommandID, this.onCommand);

        [Dts.EServerSocketEvents].forEach(events => {
            Object.keys(events).forEach(key => {
                let value = events[key];
                this.socket.addListener(value, (...args: any[]) => {
                    console.log('ServerEvent', value, ...args ? args[0]: '')
                })
            })
        })
    }
    unInitEvents() {
        this.socket.removeAllListeners();        
    }

    // Command business
    onCommand = (cmd: Dts.ICommandData<any>, cb?: (result: boolean) => void) => {        
        cb && cb(true)
        this.dispatcher.onCommand(cmd, this);
    }
    sendCommand = (cmd: Dts.ICommandData<any>, includeSelf?: boolean) => {
        cmd.from = cmd.from || {};
        cmd.from.type = cmd.from.type || 'server';
        cmd.from.id = cmd.from.id || '';

        switch(cmd.to.type) {
            case 'room':
                cmd.to.id = cmd.to.id || this.user.room.id;
                this.socket.to(cmd.to.id).emit(Dts.CommandID, cmd);
                includeSelf && this.socket.emit(Dts.CommandID, cmd);
                break;
            case 'socket':
                cmd.to.id = cmd.to.id || this.socket.id;
                if (this.socket.id === cmd.to.id) {
                    this.socket.emit(Dts.CommandID, cmd);
                } else {
                    this.socket.to(cmd.to.id).emit(Dts.CommandID, cmd);
                }
                break
            case 'user':
                cmd.to.id = cmd.to.id || this.user.id;
                if (this.user.id === cmd.to.id) {
                    this.socket.emit(Dts.CommandID, cmd);
                } else {
                    let toUser = this.users.users.get(cmd.to.id);
                    if (toUser) {
                        this.socket.to(toUser.socket.id).emit(Dts.CommandID, cmd)
                    }
                }
            case 'server':
                break;                
            default:
                this.socket.emit(Dts.CommandID, cmd);
                break;
        }
        console.log('SendCommand', cmd.cmdId, cmd.to)
    }

    // User business
    // isLogin(): boolean {
    //     return !!(this.user && this.users.users.exist(this.user.id))
    // }
    // isAgency(): Boolean {
    //     let label = this.user && this.user.state || 0;
    //     return (label & Dts.EUserLabel.agency) === Dts.EUserLabel.agency;
    // }
    // isStreamReceiver(): Boolean {
    //     let label = this.user && this.user.label || 0;
    //     return (label & Dts.EUserLabel.streamReceiver) === Dts.EUserLabel.streamReceiver;
    // }   
    // isStreamSender(): boolean {
    //     let label = this.user && this.user.label || 0;
    //     return (label & Dts.EUserLabel.streamSender) === Dts.EUserLabel.streamSender;        
    // } 
    // login(data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>): Promise<any> {
    //     if (!this.isLogin()) {
    //         let user = Object.assign({}, data.props.user) as Dts.IUser;    
    //         this.user = user;        
    //         this.users.addSocketUser(this);                       
    //         return this.users.joinAdhocRoom(this)        
    //     } else {
    //         return Promise.resolve(this.user.room.id)
    //     }
    // }
    // logout(data?: Dts.ICommandData<Dts.ICommandLogoutReqDataProps>, includeSelf?: boolean, disconnect?: boolean) {
    //     if (this.isLogin()) {
    //         data = data || {
    //             cmdId: Dts.ECommandId.adhoc_logout,
    //             props: {
    //                 user: this.user
    //             }
    //         }
    //         data.to = {type: 'room', id: this.user.room.id};
    //         this.sendCommand(data, includeSelf);
    //         this.users.delSocketUser(this.user.id);
    //         this.users.leaveAdhocRoom(this);
    //         delete this.user;
    //     }    
    //     disconnect && this.socket.connected && this.socket.disconnect();
    // }

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