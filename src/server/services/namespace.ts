import * as Amd from '../amd/index'
import * as Modules from '../modules'
import * as Dts from "../dts";
import { ICommandDeliverDataExtraProps } from '../amd/signal-client/dts';
import { ServiceUser } from './user';
import { ServiceRoom } from './room';

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
        
        console.log('onDeliverCommand', cmd.props.cmdId, extra.to);        
        switch(extra.to.type) {
            case 'socket':
                console.log('socket_onDeliverCommand', data.cmdId )  
                let userSocket = namespace.nsp.sockets[extra.to.id] as Modules.IUserSocket;
                toSckUser = userSocket && userSocket.user;           
                ServiceUser.onDeliverCommand(toSckUser, data, true);
            case 'user':
                console.log('user_onDeliverCommand', data.cmdId )  
                toSckUser = namespace.users.users.get(extra.to.id);
                ServiceUser.onDeliverCommand(toSckUser, data, true);
                break;
            case 'room':
                console.log('room_onDeliverCommand', data.cmdId )  
                let includeSelf = extra.props.includeSelf;
                ServiceRoom.onDeliverCommand(namespace, extra.to.id, fromSckUser, data, !fromSckUser || includeSelf);
                break;
            case 'server':       
                console.log('server_onDeliverCommand', data.cmdId )  
                fromSckUser && fromSckUser.dispatcher.onCommand(data, fromSckUser);       
                break;
        }

    }      
    
    static getRoomUsers(namespace: Modules.ISocketNamespace, roomid: string, count: number = -1): Modules.ISocketUser[] {
        let result = [];
        let users = namespace.users;  
        let adapter = namespace.nsp.adapter;
        let uroom = users.rooms.get(roomid);
        let sim = uroom && uroom.sim || '';
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
    static getRoomFirstUser(namespace: Modules.ISocketNamespace, roomid: string): Modules.ISocketUser {
        let result = this.getRoomUsers(namespace, roomid, 1);
        return result.length > 0 ? result[0] : null;
    }    
 }