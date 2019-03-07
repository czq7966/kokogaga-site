import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ServiceCommon } from '../common';

export class ConfigUpdate {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let url = data.extra;
            Modules.Config.update(url)
            .then(() => {
                ServiceCommon.respCommand(data, sckUser, true)
            })
            .catch(err => {
                ServiceCommon.respCommand(data, sckUser, false, err)
            })
        }
    }


}