import * as Dts from './dts';
import * as Common from './common/index'
import { SocketUser } from '../user';

// Req
export class CommandLogoutReq extends Common.Command<Dts.ICommandLogoutReqData, Common.ICommandConstructorParams<Dts.ICommandLogoutReqDataProps>>  {

    onDispatched(reqCmd: CommandLogoutReq, sckUser: SocketUser) {
        this.onReq(sckUser, reqCmd.data)
    }    

    // logical business
    onReq(sckUser: SocketUser, data: Dts.ICommandLogoutReqData) {     
        sckUser.logout(data, false);
    }    
}


Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.adhoc_logout,
    name: '登录',
    ReqClass: CommandLogoutReq as any,
    RespClass: null
})

new CommandLogoutReq({instanceId: Dts.dispatcherInstanceName});

