import * as Dts from "../dts";
import * as Cmds from '../cmds/index'
import * as Modules from '../modules/index'
import * as Admin from './admin/index'
import { ServiceRoom } from "./room";
import { ServiceRoomClose } from "./room-close";
import { ServiceUsers } from "./users";
import { ISignalClient } from "../amd/signal-client";


export class ServiceUser extends Cmds.Common.Base {
    static getDatabaseNamespace(sckUser: Modules.ISocketUser): Modules.IDataNamespace {
        return sckUser.notDestroyed && sckUser.users.snsp.server.getDatabase().getNamespace(sckUser.users.snsp.options.name)
    }    
    static connected(sckUser: Modules.ISocketUser): boolean {        
        return sckUser && sckUser.connected()
    }    
    static async isLogin(sckUser: Modules.ISocketUser): Promise<boolean> {   
        return sckUser.isLogin()
    }
    static async login(sckUser: Modules.ISocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>): Promise<any> {
        if (sckUser.connected()) {
            if (sckUser.users.snsp.nsp.name === Dts.AdminNamespacename) 
                return await Admin.Admin.login(sckUser, data)
            else 
                return await this.userLogin(sckUser, data)
        } else {
            throw 'User is disconnected.'
        }
    }
    static async userLogin(sckUser: Modules.ISocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>): Promise<any> {
        let room = data.props.user.room;
        let isLogin = sckUser.isLogin();
        if (!isLogin) {
            let user = Object.assign({}, data.props.user) as Dts.IUser;  
            user.room = room;
            sckUser.user = user;   
            await ServiceUsers.addSocketUser(sckUser.users, sckUser)     
            await ServiceRoom.joinOrCreate(room.id, sckUser)
            sckUser.setLogin(true);
        } else {
            return room.id
        }
    }

    static async logout(sckUser: Modules.ISocketUser, 
                    data?: Dts.ICommandData<Dts.ICommandLogoutReqDataProps>, 
                    includeSelf?: boolean, disconnect?: boolean): Promise<any> {
        // let isLogin = await this.isLogin(sckUser);
        let user = sckUser.user;
        let isLogin = sckUser.isLogin();
        if (isLogin) {
            await this.closeOpenRooms(sckUser);

            data = data || {
                cmdId: Dts.ECommandId.adhoc_logout,
                props: {
                    user: user
                }
            }
            data.to = {type: 'room', id: sckUser.user.room.id};
            await sckUser.sendCommand(data, includeSelf);

            await ServiceRoom.leaveOrClose(user.room.id, user, sckUser)
            await ServiceUsers.delSocketUser(sckUser.users, user);
            // delete sckUser.user;
            sckUser.setLogin(false);
        }    
        disconnect && sckUser.notDestroyed && sckUser.socket && sckUser.socket.connected && sckUser.socket.disconnect();
    }
    static async closeOpenRooms(sckUser: Modules.ISocketUser) {
        let promises = [];
        sckUser.openRooms.keys().forEach(key => {
            promises.push(ServiceRoomClose.close(key, sckUser));
        })
        return Promise.all(promises);
    }    
    static async onCommand(sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>)  {   
        let useSignalCenter = sckUser.users.snsp.options.useSignalCenter;
        if (!!useSignalCenter) {
            let signalClient = sckUser.users.snsp.server.getSignalClient();
            if (signalClient && signalClient.isReady()) {
                try {
                    sckUser.dispatcher.polyfillCommand(cmd, sckUser);
                    await this.deliverCommand(signalClient, sckUser, cmd);                    
                } catch(e) {
                    await sckUser.dispatcher.onCommand(cmd, sckUser);                    
                }
            } else {
                await sckUser.dispatcher.onCommand(cmd, sckUser);   
            }
        } else {
            await sckUser.dispatcher.onCommand(cmd, sckUser);
        }
    }
    static async sendCommand(sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf?: boolean, forResp?: boolean) {
        let useSignalCenter = sckUser.users.snsp.options.useSignalCenter;
        if (!!useSignalCenter) {
            let signalClient = sckUser.users.snsp.server.getSignalClient();
            if (signalClient && signalClient.isReady()) {
                try {
                    sckUser.dispatcher.polyfillCommand(cmd, sckUser);
                    return await this.deliverCommand(signalClient, sckUser, cmd, includeSelf, forResp);                    
                } catch(e) {
                    return await sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);                    
                }
            } else {
                return await sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);   
            }
        } else {
            return await sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);
        }
    }
    static async addRoom(sckUser: Modules.ISocketUser, room: Dts.IRoom, notForce?: boolean)  {   
        if(room) {
            if (!sckUser.openRooms.exist(room.id) || !notForce) {
                sckUser.openRooms.add(room.id, room)
            }
        }
    }
    static async delRoom(sckUser: Modules.ISocketUser, roomid: string, notForce?: boolean)  {   
        if (sckUser.openRooms.exist(roomid) || !notForce) {
            sckUser.openRooms.del(roomid)
        }
    }
    static async deliverCommand(signalClient: ISignalClient, sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf?: boolean, forResp?: boolean) {
        if (signalClient) {
            return signalClient.deliverUserCommand(sckUser, cmd, includeSelf, forResp);
        } else {
            throw "signal client is not loaded yet!"
        }
    }   
    static async onDeliverCommand(sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf: boolean) {
        if(sckUser && sckUser.notDestroyed) {
            await sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);
        }
    }      
}