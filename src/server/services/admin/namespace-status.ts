import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ServiceServer } from '../server';
import { ServiceCommon } from '../common';

export class NamespaceStatus {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let names = data.extra;
            typeof(names) === 'string' && (names = [names])                        
            if (names instanceof Array) {
                let status = ServiceServer.getNamespaceStatus(sckUser.users.snsp.server, names)
                ServiceCommon.respCommand(data, sckUser, true, undefined, status);
            } else {
                ServiceCommon.respCommand(data, sckUser, false, 'Names must string or string array')
            }
        }
    }


}