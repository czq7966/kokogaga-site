import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Services from '../../services'
import * as Modules from '../../modules'

// Req
export class CommandRoomLeaveReq extends Common.Command<Dts.ICommandRoomLeaveReqDataProps>  {
    onDispatched(reqCmd: CommandRoomLeaveReq, sckUser: Modules.SocketUser) {
        Services.ServiceRoomLeave.onDispatched.req(reqCmd, sckUser);
    }      
}


Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.room_leave,
    name: '关群',
    ReqClass: CommandRoomLeaveReq,
    RespClass: null
})

new CommandRoomLeaveReq({instanceId: Dts.dispatcherInstanceName});

