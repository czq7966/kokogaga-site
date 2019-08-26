import * as Dts from '../../cmds/dts';
import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ConfigUpdate } from './config-update';
import { ConfigGet } from './config-get';
import { NamespaceClose } from './namespace-close';
import { NamespaceOpen } from './namespace-open';
import { NamespaceReset } from './namespace-reset';
import { NamespaceStatus } from './namespace-status';
import { ServiceUser } from '../user';
import { UsersGet } from './users-get'

export class Admin {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            if (sckUser.users.snsp.nsp.name === Dts.AdminNamespacename) {
                switch (data.cmdId) {
                    case Dts.ECommandId.admin_config_get:
                        ConfigGet.onDispatched.req(cmd, sckUser);
                        break;
                    case Dts.ECommandId.admin_config_update:
                        ConfigUpdate.onDispatched.req(cmd, sckUser);
                        break;
                    case Dts.ECommandId.admin_namespace_close:
                        NamespaceClose.onDispatched.req(cmd, sckUser);
                        break;                    
                    case Dts.ECommandId.admin_namespace_open:
                        NamespaceOpen.onDispatched.req(cmd, sckUser);
                        break;
                    case Dts.ECommandId.admin_namespace_reset:
                        NamespaceReset.onDispatched.req(cmd, sckUser);
                        break;
                    case Dts.ECommandId.admin_namespace_status:
                        NamespaceStatus.onDispatched.req(cmd, sckUser);
                        break;           
                    case Dts.ECommandId.admin_users_get:
                            UsersGet.onDispatched.req(cmd, sckUser);
                            break;                                            
                }
            }
        }
    }

    static login(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>): Promise<any> {
        if (data.props.user.extra === '7894561230.') {
            return ServiceUser.userLogin(sckUser, data)
        } else 
            return Promise.reject('Invalid Password')
    }


}