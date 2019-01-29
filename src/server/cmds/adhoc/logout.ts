import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Modules from '../../modules'
import * as Services from '../../services'

// Req
export class CommandLogoutReq extends Common.Command<Dts.ICommandLogoutReqDataProps>{

    onDispatched(reqCmd: CommandLogoutReq, sckUser: Modules.SocketUser) {
        // this.onReq(sckUser, reqCmd.data)
        Services.ServiceLogout.onDispatched.req(reqCmd, sckUser);
    }    

    // logical business
    // onReq(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLogoutReqDataProps>) {     
    //     sckUser.logout(data, true, false);
    // }    
}


Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.adhoc_logout,
    name: '登录',
    ReqClass: CommandLogoutReq as any,
    RespClass: null
})

new CommandLogoutReq({instanceId: Dts.dispatcherInstanceName});

