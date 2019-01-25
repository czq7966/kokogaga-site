import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Services from '../../services'
import * as Modules from '../../modules'

// Req
export class CommandRoomJoinReq extends Common.Command<
            Dts.ICommandData<Dts.ICommandRoomJoinReqDataProps>, 
            Common.ICommandConstructorParams<Dts.ICommandRoomJoinReqDataProps> >  {
    onDispatched(reqCmd: CommandRoomJoinReq, sckUser: Modules.SocketUser) {
        Services.ServiceRoomJoin.onDispatched.req(reqCmd, sckUser);
    }      
}


Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.room_join,
    name: '加群',
    ReqClass: CommandRoomJoinReq,
    RespClass: null
})

new CommandRoomJoinReq({instanceId: Dts.dispatcherInstanceName});

