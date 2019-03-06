import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Modules from '../../modules'
import * as Services from '../../services'

// Req
export class CommandConfigUpdateReq extends Common.Command<Dts.ICommandReqDataProps> {
    onDispatched(cmd: CommandConfigUpdateReq, sckUser: Modules.SocketUser) {
        Services.ServiceLogin.onDispatched.req(cmd, sckUser);
    }    
}

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.adhoc_login,
    name: '登录',
    ReqClass: CommandConfigUpdateReq as any,
    RespClass: null
})

new CommandConfigUpdateReq({instanceId: Dts.dispatcherInstanceName});

