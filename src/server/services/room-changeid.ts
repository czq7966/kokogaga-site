import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index';
import * as Modules from '../modules';
import { ServiceRoom } from './room';

export class ServiceRoomChangeId {

    static onDispatched = {
        req(cmd: Cmds.CommandRoomChangeIdReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let room = data.props.user.room
            let respToUser = (result: boolean, msg: any) => {
                let resp: Dts.ICommandData<Dts.ICommandRoomChangeIdRespDataProps> = Object.assign({}, data, {
                    type: Dts.ECommandType.resp,
                    from: {type: 'server', id: ''},
                    to: data.from      
                } as any);
                resp.props.result = result;
                resp.props.msg = msg;
                sckUser.sendCommand(resp);    
            }
            if (sckUser.openRooms.exist(room.id)) {
                if (ServiceRoom.exist(room.id, sckUser)) {  
                    let oldId = room.id;
                    let newId = data.props.user.extra as string;
                    ServiceRoom.changeId(oldId, newId, sckUser)
                    .then(() => {
                        let req: Dts.ICommandData<Dts.ICommandRoomChangeIdReqDataProps> = Object.assign({}, data, {
                            sessionId: null,
                            to: {type: 'room', id: newId}      
                        } as any);
                        sckUser.sendCommand(req);  
                        respToUser(true, null); 
                    })
                    .catch(err => {
                        respToUser(false, err);                          
                    })
                } else {
                    respToUser(false, 'Room not exist!');             
                }
            } else {
                respToUser(false, 'You are not the room owner');
            }
        }
    }
}