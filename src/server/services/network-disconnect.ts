import * as Cmds from '../cmds/index'
import * as Modules from '../modules'


var Tag = 'ServiceNetworkDisconnect'
export class ServiceNetworkDisconnect extends Cmds.Common.Base {
    static onDispatched = {
        req(cmd: Cmds.CommandNetworkDisconnectReq, sckUser: Modules.SocketUser) {

        }
    }
}