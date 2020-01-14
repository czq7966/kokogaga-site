import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index';
import * as Modules from '../modules';
import { ServiceRoom } from './room';

export class ServiceRoomOpen extends Cmds.Common.Base {

    static onDispatched = {
        async req(cmd: Cmds.CommandRoomOpenReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let room = data.props.user.room
            if (sckUser.openRooms.exist(room.id) && await ServiceRoom.exist(room.id, sckUser)) {
                let resp: Dts.ICommandData<Dts.ICommandRoomOpenRespDataProps> = Object.assign({}, data, {
                    type: Dts.ECommandType.resp,
                    from: {type: 'server', id: ''},
                    to: data.from  
                }) as any;                    
                resp.respResult = true;
                sckUser.sendCommand(resp);
            } else if (await ServiceRoom.exist(room.id, sckUser)) {       
                let resp: Dts.ICommandData<Dts.ICommandRoomOpenRespDataProps> = Object.assign({}, data, {
                    type: Dts.ECommandType.resp,
                    from: {type: 'server', id: ''},
                    to: data.from      
                } as any);
                resp.respResult = false;
                resp.respMsg = 'Room already exist!'
                sckUser.sendCommand(resp);
            } else {
                ServiceRoom.open(room.id, sckUser)
                .then(roomid => {
                    let resp: Dts.ICommandData<Dts.ICommandRoomOpenRespDataProps> = Object.assign({}, data, {
                        type: Dts.ECommandType.resp,
                        from: {type: 'server', id: ''},
                        to: data.from  
                    }) as any;                    
                    resp.respResult = true;
                    sckUser.sendCommand(resp);
                })
                .catch(err => {
                    let resp: Dts.ICommandData<Dts.ICommandRoomOpenRespDataProps> = Object.assign({}, data, {
                        type: Dts.ECommandType.resp,
                        from: {type: 'server', id: ''},
                        to: data.from,         
                    }) as any;  
                    resp.respResult = false;
                    resp.respMsg = err
                    sckUser.sendCommand(resp);
                })
            }
        }
    }


}