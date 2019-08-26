import * as Cmds from '../../cmds/index';
import * as Modules from '../../modules';
import { ServiceCommon } from '../common';

export class UsersGet {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            let data = cmd.data;
            let extra = data.extra || {};
            let namespace = extra.namespace || "";
            let from = extra.from || 0;
            let to = extra.to || 0;
            let server = sckUser.users.snsp.server;
            let snsp = server.snsps.get(namespace);
            if (snsp) {
                let extra = {};
                let users = snsp.users.users;
                let keys = users.keys();
                let count = keys.length;
                let respUsers = [];

                to = to > count - 1 ? count -1 : to;
                for (let idx = from; idx <= to; idx++) {
                    let key = keys[idx];
                    let user = users.get(key);
                    user && respUsers.push(user.user)
                }

                extra['count'] = count;
                extra['users'] = respUsers;
                ServiceCommon.respCommand(data, sckUser, true, null, extra);
            } else {
                ServiceCommon.respCommand(data, sckUser, false, "Can't find namespace of name: " + namespace);
            }
        }
    }
}