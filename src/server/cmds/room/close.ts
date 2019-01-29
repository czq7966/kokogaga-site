import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Services from '../../services'
import * as Modules from '../../modules'

// Req
export class CommandRoomCloseReq extends Common.Command<Dts.ICommandRoomCloseReqDataProps>  {
    onDispatched(reqCmd: CommandRoomCloseReq, sckUser: Modules.SocketUser) {
        Services.ServiceRoomClose.onDispatched.req(reqCmd, sckUser);
    }      
}


Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.room_close,
    name: '关群',
    ReqClass: CommandRoomCloseReq,
    RespClass: null
})

new CommandRoomCloseReq({instanceId: Dts.dispatcherInstanceName});

