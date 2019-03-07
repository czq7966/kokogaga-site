import * as Dts from './dts';
import * as Common from './common/index'
import * as Modules from '../modules'
import * as Services from '../services'

// Common
export class CommandCommon extends Common.Command<any>  {
    onDispatched(cmd: Common.ICommand, sckUser: Modules.SocketUser) {
        Services.ServiceCommon.onDispatched.req(cmd, sckUser);
    }    
}

new CommandCommon({instanceId: Dts.dispatcherInstanceName});

[
    Dts.ECommandId.custom,
    Dts.ECommandId.adhoc_hello,
    Dts.ECommandId.room_hello,
    Dts.ECommandId.stream_room_hello,
    Dts.ECommandId.stream_webrtc_offer,
    Dts.ECommandId.stream_webrtc_answer,
    Dts.ECommandId.stream_webrtc_sdp,
    Dts.ECommandId.stream_webrtc_candidate,
    Dts.ECommandId.stream_webrtc_ready
].forEach(commanid => {
    Common.CommandTypes.RegistCommandType({
        cmdId: commanid,
        name: commanid,
        ReqClass: CommandCommon,
        RespClass: CommandCommon
    })
})


// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.custom,
//     name: '自定义',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })

// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.adhoc_hello,
//     name: '握手',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })

// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.room_hello,
//     name: '握手',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })

// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.stream_room_hello,
//     name: '握手',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })

// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.stream_webrtc_offer,
//     name: 'offer',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })

// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.stream_webrtc_answer,
//     name: 'answer',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })

// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.stream_webrtc_sdp,
//     name: 'sdp',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })

// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.stream_webrtc_candidate,
//     name: 'candidate',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })

// Common.CommandTypes.RegistCommandType({
//     cmdId: Dts.ECommandId.stream_webrtc_ready,
//     name: 'ready',
//     ReqClass: CommandCommon,
//     RespClass: CommandCommon
// })