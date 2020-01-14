import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import { ServiceRoom } from './room';

var Tag = 'ServiceRoomLeave'
export class ServiceRoomLeave extends Cmds.Common.Base {
    static onDispatched = {
        async req(cmd: Cmds.CommandRoomLeaveReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let room = data.props.user.room
            let req: Dts.ICommandData<Dts.ICommandRoomLeaveReqDataProps>;
            let resp: Dts.ICommandData<Dts.ICommandRoomLeaveRespDataProps>;
            // Send to members
            data.props.user = data.props.user || sckUser.user;
            req = Object.assign({}, data);     
            req.to = {type: 'room', id: room.id}
            await sckUser.sendCommand(req);

            // Leave room
            ServiceRoom.leave(room.id, sckUser)
            .then(() => {
                resp = Object.assign({}, data, {
                    type: Dts.ECommandType.resp,
                    from: {type: 'server', id: ''},
                    to: data.from
                }) as any; 
                resp.respResult = true;
                sckUser.sendCommand(resp);
            })
            .catch(err => {
                resp = Object.assign({}, data, {
                    type: Dts.ECommandType.resp,
                    from: {type: 'server', id: ''},
                    to: data.from
                }) as any; 
                resp.respResult = false;
                resp.respMsg = err;
                sckUser.sendCommand(resp);
            })
        }
    }
}