import { SocketUsers, ISocketUsers } from "./users";
import * as Dts from "../dts";
import * as Cmds from "../cmds/index";
import * as Services from '../services/index'
import { ISocketIONamespace } from "./namespace";


export interface IUserSocket extends SocketIO.Socket {
    user?: SocketUser
}

export interface ISocketUser extends Cmds.Common.IBase {
    user: Dts.IUser;
    users: ISocketUsers;
    socket: IUserSocket;
    dispatcher: Services.Dispatcher;
    openRooms: Cmds.Common.Helper.KeyValue<boolean>;    
    onCommand: (cmd: Dts.ICommandData<any>, cb?: (result: boolean) => void) => void
    sendCommand: (cmd: Dts.ICommandData<any>, includeSelf?: boolean) => void
}

export class SocketUser  extends Cmds.Common.Base implements ISocketUser {
    user: Dts.IUser;
    users: ISocketUsers;
    socket: IUserSocket;
    dispatcher: Services.Dispatcher;
    openRooms: Cmds.Common.Helper.KeyValue<boolean>;
    constructor(socket: IUserSocket) {
        super()
        this.dispatcher = Services.Dispatcher.getInstance(Dts.dispatcherInstanceName);
        this.socket = socket;
        this.socket.user = this;  
        this.users = (socket.nsp as ISocketIONamespace).snsp.users;
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
        if (!this.user && cmd && cmd.cmdId !== Dts.ECommandId.adhoc_login) {
            cb && cb(false)
        } else {
            cb && cb(true)
            this.dispatcher.onCommand(cmd, this);
        }
    }
    sendCommand = (cmd: Dts.ICommandData<any>, includeSelf?: boolean) => {
        this.dispatcher.sendCommand(cmd, this, includeSelf);
        return;
        cmd.from = cmd.from || {};
        cmd.from.type = cmd.from.type || 'server';
        cmd.from.id = cmd.from.id || '';

        switch(cmd.to.type) {
            case 'room':
                cmd.to.id = cmd.to.id || this.user.room.id;
                let uroom = this.users.rooms.get(cmd.to.id)
                let sim = uroom && uroom.sim || cmd.to.id;
                this.socket.to(sim).emit(Dts.CommandID, cmd);
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
                if (this.user && (this.user.id === cmd.to.id)) {
                    this.socket.emit(Dts.CommandID, cmd);
                } else {
                    let toUser = this.users.users.get(cmd.to.id);
                    if (toUser) {
                        this.socket.to(toUser.socket.id).emit(Dts.CommandID, cmd)
                    }
                }
                break;
            case 'server':
                break;                
            default:
                this.socket.emit(Dts.CommandID, cmd);
                break;
        }
        console.log('SendCommand', cmd.cmdId, cmd.to)
    }
}