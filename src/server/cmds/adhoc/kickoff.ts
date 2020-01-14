import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Modules from '../../modules'
import * as Services from '../../services'

// Req
export class CommandKickoffReq extends Common.Command<Dts.ICommandReqDataProps> {
    onDispatched(cmd: CommandKickoffReq, sckUser: Modules.SocketUser) {
        Services.ServiceKickoff.onDispatched.req(cmd, sckUser);
    }    
}

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.adhoc_kickoff,
    name: '被踢',
    ReqClass: CommandKickoffReq as any,
    RespClass: null
})

new CommandKickoffReq({instanceId: Dts.dispatcherInstanceName});

