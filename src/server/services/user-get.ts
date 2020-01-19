import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index';
import * as Modules from '../modules';
import { ServiceRoom } from './room';
import { ServiceUsers } from './users'

export class ServiceUserGet extends Cmds.Common.Base {
    static onDispatched = {
        async req(cmd: Cmds.CommandUserGetReq, sckUser: Modules.ISocketUser) {
            let data = cmd.data;
            let user = data.props.user;
            let nspUser = await sckUser.getDataNamespace().getUser(user)
            if (nspUser) {
                let resp: Dts.ICommandData<Dts.ICommandRespDataProps> = Object.assign({}, data, {
                    type: Dts.ECommandType.resp,
                    from: {type: 'server', id: ''},
                    to: data.from,
                    props: {
                        user: nspUser
                    }
                }) as any;                    
                resp.respResult = true;
                sckUser.sendCommand(resp);                
            } else {
                let resp: Dts.ICommandData<Dts.ICommandRespDataProps> = Object.assign({}, data, {
                    type: Dts.ECommandType.resp,
                    from: {type: 'server', id: ''},
                    to: data.from
                }) as any;                    
                resp.respResult = false;
                resp.respMsg = 'User not exist!'
                sckUser.sendCommand(resp);                                
            }
        }
    }
}