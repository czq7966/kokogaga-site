import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Services from '../../services'
import * as Modules from '../../modules'

// Req
export class CommandUserSetReq extends Common.Command<Dts.ICommandReqDataProps>  {
    onDispatched(reqCmd: CommandUserSetReq, sckUser: Modules.SocketUser) {
        Services.ServiceUserSet.onDispatched.req(reqCmd, sckUser);
    }      
}

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.user_set,
    name: '设置用户信息',
    ReqClass: CommandUserSetReq,
    RespClass: null
})

new CommandUserSetReq({instanceId: Dts.dispatcherInstanceName});

