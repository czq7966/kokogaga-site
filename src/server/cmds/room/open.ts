import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Services from '../../services'
import * as Modules from '../../modules'

// Req
export class CommandRoomOpenReq extends Common.Command<Dts.ICommandRoomOpenReqDataProps>  {
    onDispatched(reqCmd: CommandRoomOpenReq, sckUser: Modules.SocketUser) {
        Services.ServiceRoomOpen.onDispatched.req(reqCmd, sckUser);
    }      
}

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.room_open,
    name: '建群',
    ReqClass: CommandRoomOpenReq,
    RespClass: null
})

new CommandRoomOpenReq({instanceId: Dts.dispatcherInstanceName});

