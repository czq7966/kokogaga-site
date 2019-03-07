import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'

var Tag = 'ServiceCommon'
export class ServiceCommon extends Cmds.Common.Base {
    static onDispatched = {
        req(cmd: Cmds.Common.ICommand, sckUser: Modules.SocketUser) {
            sckUser.sendCommand(cmd.data);
        }
    }
    static respCommand (data: Dts.ICommandData<any>, sckUser: Modules.SocketUser, result: boolean, msg?: any, dataExtra?: any) {
        let resp: Dts.ICommandData<any> = Object.assign({}, data, {
            type: Dts.ECommandType.resp,
            from: {type: 'server', id: ''},
            to: data.from,
            extra: dataExtra
        }) as any;                    
        resp.respResult = result;
        resp.respMsg = msg
        sckUser.sendCommand(resp);                
    }
}