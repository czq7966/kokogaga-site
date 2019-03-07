import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import { ServiceRoom } from './room';

export class ServiceRoomJoin extends Cmds.Common.Base {
    static onDispatched = {
        req(cmd: Cmds.CommandRoomJoinReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let room = data.props.user.room
            let resp: Dts.ICommandData<Dts.ICommandRoomJoinRespDataProps>;
            ServiceRoom.join(room.id, sckUser)
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