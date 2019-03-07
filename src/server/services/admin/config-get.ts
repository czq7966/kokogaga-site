import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ServiceCommon } from '../common';

export class ConfigGet {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            let jsonConfig = Modules.Config.getJsonConfig()
            ServiceCommon.respCommand(cmd.data, sckUser, true, undefined, jsonConfig)
        }
    }
}