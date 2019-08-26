import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ServiceServer } from '../server';
import { ServiceCommon } from '../common';
import * as Dts from '../../cmds/dts'

export class NamespaceClose {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let names = data.extra;
            typeof(names) === 'string' && (names = [names])                        
            if (names instanceof Array) {
                // can't close admin namespace
                let adminName = Dts.AdminNamespacename[0] == "/" ? Dts.AdminNamespacename.substr(1) : Dts.AdminNamespacename;
                if (names.indexOf(adminName) >= 0) {
                    ServiceCommon.respCommand(data, sckUser, false, "Can't close namesapce: " + adminName)  
                    return;                  
                } 

                //close namespaces
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