import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Modules from '../../modules'
import * as Services from '../../services'

// Req
export class CommandAdminReq extends Common.Command<Dts.ICommandReqDataProps> {
    onDispatched(cmd: CommandAdminReq, sckUser: Modules.SocketUser) {
        Services.Admin.Admin.onDispatched.req(cmd, sckUser);
    }    
}

[
    Dts.ECommandId.admin_config_update,
    Dts.ECommandId.admin_config_get,
    Dts.ECommandId.admin_namespace_close,
    Dts.ECommandId.admin_namespace_open,
    Dts.ECommandId.admin_namespace_reset,
    Dts.ECommandId.admin_namespace_status
].forEach(commanid => {
    Common.CommandTypes.RegistCommandType({
        cmdId: commanid,
        name: commanid,
        ReqClass: CommandAdminReq,
        RespClass: null
    })
})

new CommandAdminReq({instanceId: Dts.dispatcherInstanceName});

