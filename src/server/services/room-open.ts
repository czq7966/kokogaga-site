import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index';
import * as Modules from '../modules';
import { ServiceRoom } from './room';

export class ServiceRoomOpen extends Cmds.Common.Base {

    static onDispatched = {
        req(cmd: Cmds.CommandRoomOpenReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let room = data.props.room
            if (ServiceRoom.exist(room.id, sckUser)) {
                let resp: Dts.ICommandData<Dts.ICommandRoomOpenRespDataProps> = {
                    type: Dts.ECommandType.resp,
                    from: {type: 'server', id: ''},
                    to: data.from,
                    props: {
                        result: false,
                        msg: 'Room already exist!'
                    }                    
                }
                sckUser.sendCommand(resp);
            } else {
                ServiceRoom.open(room.id, sckUser)
                .then(roomid => {
                    let resp: Dts.ICommandData<Dts.ICommandRoomOpenRespDataProps> = {
                        type: Dts.ECommandType.resp,
                        from: {type: 'server', id: ''},
                        to: data.from,
                        props: {
                            result: true,
                            room: room
                        }                    
                    }
                    sckUser.sendCommand(resp);
                })
                .catch(err => {
                    let resp: Dts.ICommandData<Dts.ICommandRoomOpenRespDataProps> = {
                        type: Dts.ECommandType.resp,
                        from: {type: 'server', id: ''},
                        to: data.from,
                        props: {
                            result: false,
                            msg: err
                        }                    
                    }
                    sckUser.sendCommand(resp);
                })


            }
        }
    }


}