import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import * as Helper from '../helper'
import { ServiceRoom } from './room';
import { ServiceUser } from './user';

var Tag = 'ServiceLogout'
export class ServiceLogout extends Cmds.Common.Base {
    static onDispatched = {
        async req(cmd: Cmds.CommandLogoutReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;            
            let room: Dts.IRoom = data.props.user.room || {id: Helper.getAdhocRoomId(sckUser.socket)};
            let req: Dts.ICommandData<Dts.ICommandLogoutReqDataProps>;
            let resp: Dts.ICommandData<Dts.ICommandLogoutRespDataProps>;
            data.props.user = data.props.user || sckUser.user;
            data.props.user.room = data.props.user.room || room;

            // Send to members
            await ServiceUser.logout(sckUser);

            // Resp to user
            resp = Object.assign({}, data, {
                type: Dts.ECommandType.resp,
                from: {type: 'server', id: ''},
                to: {type: 'socket', id: sckUser.socket.id},
                props: {
                    user: data.props.user            
                },
            }); 
            resp.respResult = true;
            await sckUser.sendCommand(resp);
            sckUser.socket.connected && sckUser.socket.disconnect();
        }
    }
}