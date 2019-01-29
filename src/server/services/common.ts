import * as Cmds from '../cmds/index'
import * as Modules from '../modules'

var Tag = 'ServiceCommon'
export class ServiceCommon extends Cmds.Common.Base {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            sckUser.sendCommand(cmd.data);
        }
    }
}