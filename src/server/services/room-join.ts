import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import { ServiceRoom } from './room';

export class ServiceRoomJoin extends Cmds.Common.Base {

    static onDispatched = {
        req(cmd: Cmds.CommandRoomJoinReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let room = data.props.room
            if (ServiceRoom.exist(room.id, sckUser)) {

            } else {

            }
            
        }
    }


}