import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ServiceServer } from '../server';
import { ServiceCommon } from '../common';

export class NamespaceClose {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let names = data.extra;
            typeof(names) === 'string' && (names = [names])                        
            if (names instanceof Array) {
                ServiceServer.closeNamespaces(sckUser.users.snsp.server, data.extra)
                .then(() => {
                    ServiceCommon.respCommand(data, sckUser, true)
                })
                .catch(err => {
                    ServiceCommon.respCommand(data, sckUser, false, err)
                })
            } else {
                ServiceCommon.respCommand(data, sckUser, false, 'Names must string or string array')
            }
        }
    }


}