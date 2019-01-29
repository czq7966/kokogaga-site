import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import { ServiceUser } from './user';


var Tag = 'ServiceNetworkDisconnecting'
export class ServiceNetworkDisconnecting extends Cmds.Common.Base {
    static onDispatched = {
        req(cmd: Cmds.CommandNetworkDisconnectingReq, sckUser: Modules.SocketUser) {
            ServiceUser.logout(sckUser);
        }
    }
}