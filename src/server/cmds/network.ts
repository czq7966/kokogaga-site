import * as Dts from './dts';
import * as Common from './common/index'
import * as Modules from '../modules'
import * as Services from '../services'

// Network
export class CommandNetworkDisconnectingReq extends Common.Command<any>  {
    onDispatched(cmd: CommandNetworkDisconnectingReq, sckUser: Modules.SocketUser) {
        Services.ServiceNetworkDisconnecting.onDispatched.req(cmd, sckUser);        
    }    
}

export class CommandNetworkDisconnectReq extends Common.Command<any>  {
    onDispatched(cmd: CommandNetworkDisconnectReq, sckUser: Modules.SocketUser) {
        Services.ServiceNetworkDisconnect.onDispatched.req(cmd, sckUser);        
    }    
}


Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.network_disconnecting,
    name: '断开中',
    ReqClass: CommandNetworkDisconnectingReq as any,
    RespClass: null
})

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.network_disconnect,
    name: '已断开',
    ReqClass: CommandNetworkDisconnectingReq as any,
    RespClass: null
})

new CommandNetworkDisconnectingReq({instanceId: Dts.dispatcherInstanceName});
new CommandNetworkDisconnectReq({instanceId: Dts.dispatcherInstanceName});