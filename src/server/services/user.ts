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
        return sckUser.users.snsp.server.database.getNamespace(sckUser.users.snsp.options.name)
    }    
    static async isLogin(sckUser: Modules.ISocketUser): Promise<boolean> {        
        return !!(sckUser.user && await ServiceUsers.existSocketUser(sckUser.users, sckUser.user))
    }

    static async login(sckUser: Modules.ISocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>): Promise<any> {
        if (sckUser.users.snsp.nsp.name === Dts.AdminNamespacename) 
            return await Admin.Admin.login(sckUser, data)
        else 
            return await this.userLogin(sckUser, data)
    }
    static async userLogin(sckUser: Modules.ISocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>): Promise<any> {
        let room = data.props.user.room;
        let isLogin = await ServiceUser.isLogin(sckUser) 
        if (!isLogin) {
            let user = Object.assign({}, data.props.user) as Dts.IUser;  
            user.room = room;
            sckUser.user = user;   
            await ServiceUsers.addSocketUser(sckUser.users, sckUser)     
            await ServiceRoom.joinOrOpen(room.id, sckUser)
        } else {
            return room.id
        }
    }

    static async logout(sckUser: Modules.ISocketUser, 
                    data?: Dts.ICommandData<Dts.ICommandLogoutReqDataProps>, 
                    includeSelf?: boolean, disconnect?: boolean): Promise<any> {
        let isLogin = await this.isLogin(sckUser);
        if (isLogin) {
            await this.closeOpenRooms(sckUser);

            data = data || {
                cmdId: Dts.ECommandId.adhoc_logout,
                props: {
                    user: sckUser.user
                }
            }
            data.to = {type: 'room', id: sckUser.user.room.id};
            await sckUser.sendCommand(data, includeSelf);

            await ServiceUsers.delSocketUser(sckUser.users, sckUser);
            delete sckUser.user;
            await ServiceRoom.leaveOrClose(data.props.user.room.id, sckUser)
        }    
        disconnect && sckUser.socket.connected && sckUser.socket.disconnect();
        console.log('22222222', ServiceUser.getDatabaseNamespace(sckUser));        

    }
    static async closeOpenRooms(sckUser: Modules.ISocketUser) {
        sckUser.openRooms.keys().forEach(key => {
            ServiceRoomClose.close(key, sckUser)
        })
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
    static async sendCommand(sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf?: boolean) {
        let useSignalCenter = sckUser.users.snsp.options.useSignalCenter;
        if (!!useSignalCenter) {
            let signalClient = sckUser.users.snsp.server.getSignalClient();
            if (signalClient && signalClient.isReady()) {
                try {
                    sckUser.dispatcher.polyfillCommand(cmd, sckUser);
                    await this.deliverCommand(signalClient, sckUser, cmd, includeSelf);                    
                } catch(e) {
                    await sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);                    
                }
            } else {
                await sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);   
            }
        } else {
            await sckUser.dispatcher.sendCommand(cmd, sckUser, includeSelf);
        }
    }
    static async deliverCommand(signalClient: ISignalClient, sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf?: boolean) {
        if (signalClient) {
            return await signalClient.deliverUserCommand(sckUser, cmd, includeSelf);
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