import * as Amd from '../amd/index'
import * as Modules from '../modules'
import * as Dts from "../dts";
import { ICommandDeliverDataExtraProps } from '../amd/signal-client/dts';
import { ServiceUser } from './user';
import { ServiceRoom } from './room';
import { ServiceKickoff } from './kickoff';

export class ServiceNamespace  {
    static async onDeliverCommand(namespace: Modules.ISocketNamespace, cmd: Dts.ICommandData<any>) {
        let data = cmd.props as Dts.ICommandData<Dts.ICommandDataProps>;
        let extra = cmd.extra as  Dts.ICommandData<ICommandDeliverDataExtraProps>;
        let fromSckUser: Modules.ISocketUser;
        let toSckUser: Modules.ISocketUser;
        switch(extra.from.type) {
            case 'socket':
                let userSocket = namespace.nsp.sockets[extra.from.id] as Modules.IUserSocket;
                fromSckUser = userSocket && userSocket.user;
                break
            case 'user':
                fromSckUser = namespace.users.users.get(extra.from.id);
                break;
        }
        
        Logging.log('onDeliverCommand', cmd.props.cmdId, extra.to);        
        switch(extra.to.type) {
            case 'socket':
                Logging.log('socket_onDeliverCommand', data.cmdId )  
                let userSocket = namespace.nsp.sockets[extra.to.id] as Modules.IUserSocket;
                toSckUser = userSocket && userSocket.user;           
                ServiceUser.onDeliverCommand(toSckUser, data, true);
            case 'user':
                Logging.log('user_onDeliverCommand', data.cmdId )  
                toSckUser = namespace.users.users.get(extra.to.id);
                ServiceUser.onDeliverCommand(toSckUser, data, true);
                break;
            case 'room':
                Logging.log('room_onDeliverCommand', data.cmdId )  
                let includeSelf = extra.props.includeSelf;
                ServiceRoom.onDeliverCommand(namespace, extra.to.id, fromSckUser, data, !fromSckUser || includeSelf);
                break;
            case 'server':       
                if (extra.to.id == namespace.server.getId()) {
                    Logging.log('server_onDeliverCommand', data.cmdId )  
                    if (fromSckUser) {
                        fromSckUser.dispatcher.onCommand(data, fromSckUser);       
                    } else {
                        this.onDeliverCommand_toServer(namespace, cmd)
                    }
                }
                break;
        }

    }      

    static async onDeliverCommand_toServer(namespace: Modules.ISocketNamespace, dlvCmd: Dts.ICommandData<any>) {
        let data = dlvCmd.props as Dts.ICommandData<Dts.ICommandDataProps>;
        let extra = dlvCmd.extra as  Dts.ICommandData<ICommandDeliverDataExtraProps>;
        switch (data.cmdId) {
            case Dts.ECommandId.adhoc_kickoff:
                ServiceKickoff.onDeliverCommand_kickoff(namespace.users, data.props.user)
                break;
        }
    
    }
    
    static async getLocalRoomUsers(namespace: Modules.ISocketNamespace, roomid: string, count: number = -1): Promise<Modules.ISocketUser[]> {
        let result = [];
        let users = namespace.users;  
        let adapter = namespace.nsp.adapter;
        let uroom = users.rooms.get(roomid);
        let sim = uroom && (uroom.sim || uroom.id);
        let room = adapter.rooms[sim];
        if (room) {
            Object.keys(room.sockets).some(key => {
                let user = users.sockets.get(key);
                if (user) {
                    result.push(user); 
                    return result.length == count;
                }
            } )
        }
        return result;
    }
    static async getLocalRoomFirstUser(namespace: Modules.ISocketNamespace, roomid: string): Promise<Modules.ISocketUser> {
        let result = await this.getLocalRoomUsers(namespace, roomid, 1);
        return result.length > 0 ? result[0] : null;
    }    
 }