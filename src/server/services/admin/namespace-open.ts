import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ServiceServer } from '../server';
import { ServiceCommon } from '../common';

export class NamespaceOpen {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let names = data.extra;
            typeof(names) === 'string' && (names = [names])                        
            if (names instanceof Array) {
                // namespace must config first;
                let config = new Modules.Config();                
                let namesOfNotConfig = config.namespacesNotExist(names);
                if (namesOfNotConfig.length > 0) {
                    ServiceCommon.respCommand(data, sckUser, false, namesOfNotConfig.toString() + " must config first")
                    return;
                } 

                //open namespaces
                ServiceServer.openNamespaces(sckUser.users.snsp.server, data.extra)
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