import * as Common from '../../common'
import * as Services from '../services'
import { ECommandId } from './dts';
// Req
export class CommandUsersRefreshReq extends Common.CmdsCommon.Command<any> {
    onDispatched(cmd: CommandUsersRefreshReq, sckWorder: Common.Modules.ISocketUser) {
        Services.Cmds.Users.Refresh.onDispatched.req(cmd, sckWorder);
    }    
}

Common.CmdsCommon.CommandTypes.RegistCommandType({
    cmdId: ECommandId.signal_center_users_refresh,
    name: '刷新用户',
    ReqClass: CommandUsersRefreshReq as any,
    RespClass: null
})

new CommandUsersRefreshReq({instanceId: Common.Dts.dispatcherInstanceName});

