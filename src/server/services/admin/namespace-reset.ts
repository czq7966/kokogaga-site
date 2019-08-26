import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ServiceServer } from '../server';
import { ServiceCommon } from '../common';
import * as Dts from '../../cmds/dts'

export class NamespaceReset {
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


                //Reset admin namespace by timeout
                let adminName = Dts.AdminNamespacename[0] == "/" ? Dts.AdminNamespacename.substr(1) : Dts.AdminNamespacename
                if (names.indexOf(adminName) >= 0) {
                    setTimeout(() => {
                        ServiceServer.resetNamespaces(sckUser.users.snsp.server, names)
                    }, 3000);
                    ServiceCommon.respCommand(data, sckUser, false, "will reset after 3 secends");
                    return;
                } 

                //reset namespaces
                ServiceServer.resetNamespaces(sckUser.users.snsp.server, names)
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