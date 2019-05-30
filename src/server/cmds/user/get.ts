import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Services from '../../services'
import * as Modules from '../../modules'

// Req
export class CommandUserGetReq extends Common.Command<Dts.ICommandReqDataProps>  {
    onDispatched(reqCmd: CommandUserGetReq, sckUser: Modules.SocketUser) {
        Services.ServiceUserGet.onDispatched.req(reqCmd, sckUser);
    }      
}

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.user_get,
    name: '获取用户信息',
    ReqClass: CommandUserGetReq,
    RespClass: null
})

new CommandUserGetReq({instanceId: Dts.dispatcherInstanceName});

