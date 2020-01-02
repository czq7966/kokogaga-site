import * as Dts from '../../../dts';
import * as Common from '../../../cmds/common/index'
import * as Modules from '../../../modules'
import * as Services from '../../../services'
import { ECommandId } from './dts';

// Req
export class CommandDeleverReq extends Common.Command<any> {
    onDispatched(cmd: CommandDeleverReq, sckWorder: Modules.ISocketUser) {
        let from = cmd.data.from;
        cmd.data.from = cmd.data.to;
        cmd.data.to = from;
        sckWorder.sendCommand(cmd.data)
    }    
}

Common.CommandTypes.RegistCommandType({
    cmdId: ECommandId.signal_center_deliver,
    name: '指令分发',
    ReqClass: CommandDeleverReq as any,
    RespClass: null
})

new CommandDeleverReq({instanceId: Dts.dispatcherInstanceName});

