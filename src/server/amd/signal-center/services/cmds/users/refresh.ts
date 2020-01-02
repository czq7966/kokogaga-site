import * as Commond from '../../../../common';
import * as Cmds from '../../../cmds'

var Tag = 'ServiceCmdsUsersRefresh'
export class Refresh {
    static onDispatched = {
        req(cmd: Commond.CmdsCommon.Command<any>, sckWorker: Commond.Modules.ISocketUser) {
            let namespaces = cmd.data.props as Cmds.ICommandUsersUpdateReqProps
            Object.keys(namespaces).forEach(namespace => {
                let users = namespace[namespace];
                users.forEach(user => {
                    user.path = user.path || Cmds.DefaultPathName;
                    user.server = user.server || sckWorker.user.id;
                    user.namespace = user.namespace || namespace
                })    
            })
        }
    }
}