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
                let sockets = {};
                let clients = {};
                let users = snsp.users.users;
                let keys = users.keys();
                let count = keys.length;
                let respUsers = [];
                
                //收集连接IP
                let _socketKeys = Object.keys(snsp.nsp.sockets);
                let _socketIps = [];
                _socketKeys.forEach(key => {
                    let value = snsp.nsp.sockets[key];
                    value && _socketIps.push(value.client.conn.remoteAddress);
                })
                sockets["length"] = _socketKeys.length;
                sockets["ips"] = _socketIps;


                to = to > count - 1 ? count -1 : to;
                for (let idx = from; idx <= to; idx++) {
                    let key = keys[idx];
                    let user = users.get(key);
                    if (user) {
                        let _user = Object.assign({}, user.user);
                        _user["socket"] = {
                            "ip": user.socket.client.conn.remoteAddress
                        };
                        _user["roomOwner"] = _user.room.id.indexOf(_user.sid) > 0;

                        respUsers.push(_user);
                    }
                }
                clients["count"] = count;
                clients["users"] = respUsers;

                extra['clients'] = clients;
                extra['sockets'] = sockets;

                ServiceCommon.respCommand(data, sckUser, true, null, extra);
            } else {
                ServiceCommon.respCommand(data, sckUser, false, "Can't find namespace of name: " + namespace);
            }
        }
    }
}