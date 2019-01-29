import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import * as Helper from '../helper'
import { ServiceRoom } from './room';
import { ServiceUser } from './user';

var Tag = 'ServiceLogout'
export class ServiceLogout extends Cmds.Common.Base {
    static onDispatched = {
        req(cmd: Cmds.CommandLogoutReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;            
            let room: Dts.IRoom = data.props.user.room || {id: Helper.getAdhocRoomId(sckUser.socket)};
            let req: Dts.ICommandData<Dts.ICommandLogoutReqDataProps>;
            let resp: Dts.ICommandData<Dts.ICommandLogoutRespDataProps>;
            data.props.user = data.props.user || sckUser.user;
            data.props.user.room = data.props.user.room || room;

            // Send to members
            ServiceUser.logout(sckUser);

            // Resp to user
            resp = Object.assign({}, data, {
                type: Dts.ECommandType.resp,
                from: {type: 'server', id: ''},
                to: {type: 'socket', id: sckUser.socket.id},
                props: {
                    result: true,
                    user: data.props.user            
                }      
            }); 
            sckUser.sendCommand(resp);
            sckUser.socket.connected && sckUser.socket.disconnect();


            // // Send to members
            // req = Object.assign({}, data);     
            // req.to = {type: 'room', id: room.id}
            // sckUser.sendCommand(req);

            // // Leave adhoc room
            // ServiceRoom.leave(data.props.room.id, sckUser)
            // .then(() => {
            //     resp = Object.assign({}, data, {
            //         type: Dts.ECommandType.resp,
            //         from: {type: 'server', id: ''},
            //         to: data.from,
            //         props: {
            //             result: true,
            //             user: data.props.user,
            //             room: data.props.room                
            //         }      
            //     }); 
            //     sckUser.sendCommand(resp);
            //     sckUser.users.users.del(data.props.user.id);
            //     delete sckUser.user;
            // })
            // .catch(err => {
            //     resp = Object.assign({}, data, {
            //         type: Dts.ECommandType.resp,
            //         from: {type: 'server', id: ''},
            //         to: data.from,
            //         props: {
            //             result: false,
            //             msg: err,
            //             user: data.props.user,
            //             room: data.props.room
            //         }      
            //     }); 
            //     sckUser.sendCommand(resp);
            // })
        }
    }
}