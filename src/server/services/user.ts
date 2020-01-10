import * as Dts from "../dts";
import * as Cmds from '../cmds/index'
import * as Modules from '../modules/index'
import * as Admin from './admin/index'
import { ServiceRoom } from "./room";
import { ServiceRoomClose } from "./room-close";
import { ServiceUsers } from "./users";
import { ICommandDeliverDataExtraProps } from '../amd/signal-client/dts';
import e = require("express");

export class ServiceUser extends Cmds.Common.Base {
    static isLogin(sckUser: Modules.SocketUser): boolean {        
        return !!(sckUser.user && ServiceUsers.existUser(sckUser.users, sckUser.user))
    }

    static login(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>): Promise<any> {
        if (sckUser.users.snsp.nsp.name === Dts.AdminNamespacename) 
            return Admin.Admin.login(sckUser, data)
        else 
            return this.userLogin(sckUser, data)
    }
    static userLogin(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>): Promise<any> {
        let room = data.props.user.room;
        if (!ServiceUser.isLogin(sckUser)) {
            let user = Object.assign({}, data.props.user) as Dts.IUser;  
            user.room = room;
            sckUser.user = user;   
            ServiceUsers.addUser(sckUser.users, sckUser)     
            return ServiceRoom.joinOrOpen(room.id, sckUser)
        } else {
            return Promise.resolve(room.id)
        }
    }

    static logout(sckUser: Modules.SocketUser, 
                    data?: Dts.ICommandData<Dts.ICommandLogoutReqDataProps>, 
                    includeSelf?: boolean, disconnect?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isLogin(sckUser)) {
                this.closeOpenRooms(sckUser);

                data = data || {
                    cmdId: Dts.ECommandId.adhoc_logout,
                    props: {
                        user: sckUser.user
                    }
                }
                data.to = {type: 'room', id: sckUser.user.room.id};
                sckUser.sendCommand(data, includeSelf);

                ServiceUsers.delUser(sckUser.users, sckUser);
                delete sckUser.user;
                ServiceRoom.leave(data.props.user.room.id, sckUser)
                .then(() => {
                    resolve()
                })
                .catch(err => {
                    reject(err)
                })
            }    
            disconnect && sckUser.socket.connected && sckUser.socket.disconnect();
        })
    }
    static closeOpenRooms(sckUser: Modules.SocketUser) {
        sckUser.openRooms.keys().forEach(key => {
            ServiceRoomClose.close(key, sckUser)
        })
    }    
    static async onCommand(sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>)  {   
        let useSignalCenter = sckUser.users.snsp.options.useSignalCenter;
        if (!!useSignalCenter) {
            let signalCenter = sckUser.users.snsp.server.getSignalClient();
            if (signalCenter && signalCenter.isReady()) {
                try {
                    sckUser.dispatcher.polyfillCommand(cmd, sckUser);
                    await this.deliverCommand(sckUser, cmd);                    
                } catch(e) {
                    sckUser.dispatcher.onCommand(cmd, sckUser);                    
                }
            } else {
                sckUser.dispatcher.onCommand(cmd, sckUser);   
            }
        } else {
            sckUser.dispatcher.onCommand(cmd, sckUser);
        }
    }
    static async sendCommand(sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf?: boolean) {
        let useSignalCenter = sckUser.users.snsp.options.useSignalCenter;
        if (!!useSignalCenter) {
            let signalCenter = sckUser.users.snsp.server.getSignalClient();
            if (signalCenter && signalCenter.isReady()) {
                try {
                    sckUser.dispatcher.polyfillCommand(cmd, sckUser);
                    await this.deliverCommand(sckUser, cmd, includeSelf);                    
                } catch(e) {
                    sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);                    
                }
            } else {
                sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);   
            }
        } else {
            sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);
        }
    }
    static async deliverCommand(sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf?: boolean) {
        let signalClient = sckUser.users.snsp.server.getSignalClient();
        if (signalClient) {
            let namespace = sckUser.users.snsp.nsp.name;
            namespace = namespace.startsWith('/') ? namespace.substr(1): namespace
            let extra: Dts.ICommandData<ICommandDeliverDataExtraProps> = {
                props: {
                    namespace: namespace,
                    includeSelf: includeSelf
                },
                from: {
                    type: sckUser.user ? 'user' : 'socket',
                    id: sckUser.user ? sckUser.user.id : sckUser.socket.id                    
                },
                to: Object.assign({}, cmd.to)
            }
            await signalClient.deliverCommand(cmd, extra);
        } else {
            throw "signal client is not loaded yet!"
        }
    }   
    static async onDeliverCommand(sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf: boolean) {
        if(sckUser && sckUser.notDestroyed) {
            sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);
        }
    }      
}