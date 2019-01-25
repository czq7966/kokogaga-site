import * as Dts from './dts';
import * as Common from './common/index'
import * as Modules from '../modules'

// Common
export class CommandCommon extends Common.Command<Dts.ICommandData<any>, Common.ICommandConstructorParams<any>>  {
    onDispatched(cmd: Common.ICommand, sckUser: Modules.SocketUser) {
        sckUser.sendCommand(cmd.data);
    }    
}

new CommandCommon({instanceId: Dts.dispatcherInstanceName});

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.adhoc_hello,
    name: '握手',
    ReqClass: CommandCommon as any,
    RespClass: CommandCommon as any
})