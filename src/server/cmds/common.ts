import * as Dts from './dts';
import * as Common from './index'
import { SocketUser } from '../user';

// Common
export class CommandCommon extends Common.Command<Dts.ICommandData, Common.ICommandConstructorParams<any>>  {
    onDispatched(cmd: Common.ICommand, sckUser: SocketUser) {
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