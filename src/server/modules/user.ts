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
        this.socket.compress(true);
        this.users = (socket.nsp as ISocketIONamespace).snsp.users;
        this.openRooms = new Cmds.Common.Helper.KeyValue<any>();
        this.users.sockets.add(this.socket.id, this);
        this.initEvents();          
    }

    destroy() {
        this.unInitEvents();
        this.users.sockets.del(this.socket.id)
        delete this.openRooms;
        delete this.user
        delete this.users
        delete this.socket.user;
        delete this.socket;
        delete this.dispatcher;
        super.destroy();
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
    onCommand = async (cmd: Dts.ICommandData<any>, cb?: (result: boolean) => void) => {     
        if (!this.user && cmd && cmd.cmdId !== Dts.ECommandId.adhoc_login) {
            cb && cb(false)
        } else {
            cb && cb(true)
            await Services.ServiceUser.onCommand(this, cmd);
        }
    }
    sendCommand = async (cmd: Dts.ICommandData<any>, includeSelf?: boolean) => {
        await Services.ServiceUser.sendCommand(this, cmd, includeSelf);
    }
}