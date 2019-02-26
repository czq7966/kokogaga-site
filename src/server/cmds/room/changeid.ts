import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Services from '../../services'
import * as Modules from '../../modules'

// Req
export class CommandRoomChangeIdReq extends Common.Command<Dts.ICommandRoomChangeIdReqDataProps>  {
    onDispatched(reqCmd: CommandRoomChangeIdReq, sckUser: Modules.SocketUser) {
        Services.ServiceRoomChangeId.onDispatched.req(reqCmd, sckUser);
    }      
}

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.room_changeid,
    name: '修改ID',
    ReqClass: CommandRoomChangeIdReq,
    RespClass: null
})

new CommandRoomChangeIdReq({instanceId: Dts.dispatcherInstanceName});

