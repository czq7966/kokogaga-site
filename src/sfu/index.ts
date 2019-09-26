global.IsNode = true;
import { ADHOCCAST } from './libex'
ADHOCCAST.Modules.Webrtc.Config.platform = ADHOCCAST.Modules.Webrtc.EPlatform.node;
ADHOCCAST.Cmds.Common.Helper.Debug.enabled = false;
import WRTC = require('wrtc');
import { Main } from './main';
import './polyfill'
console.log(WRTC.RTCPeerConnection.prototype.addStream);



ADHOCCAST.Modules.Webrtc.AssignWebRTC(WRTC);

// console.log(ADHOCCAST.Modules.Webrtc.WebRTC);
var ms = new WRTC.MediaStream(); 
console.log('33333', WRTC.MediaStream);
console.log(ms.stop);
Object.keys(ms).forEach(key => {
    console.dir(key);
})

export class Preview  {
    instanceId: string
    params: URLSearchParams;
    conn: ADHOCCAST.Connection;
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;
    constructor() {
        this.instanceId = ADHOCCAST.Cmds.Common.Helper.uuid();
        let signalerBase = 'http://127.0.0.1:13670';  
        let organization = 'test';
        


        
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            signalerBase: signalerBase,
            namespace: organization
        }
        this.conn = ADHOCCAST.Connection.getInstance(connParams);

        this.eventRooter = new ADHOCCAST.Cmds.Common.EventRooter();


        this.initEvents();

    }
    destroy() {
        this.unInitEvents();
        this.conn.disconnect();
        delete this.params;
        delete this.conn;        
    }   


    initEvents() {
        this.eventRooter.setParent(this.conn.dispatcher.eventRooter);        
        this.eventRooter.onBeforeRoot.add(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.eventRooter.onBeforeRoot.remove(this.onBeforeRoot)
        this.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.eventRooter.setParent();        
    }

    onBeforeRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        cmd.preventDefault = false;
        let cmdId = cmd.data.cmdId;
        let type = cmd.data.type;
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.custom:
                if (cmd.data.extra === 'talkto') {
                    this.onCommand_TalkTo(cmd as any)
                }
                break;
            default:
                break;
        }
    }

    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        let cmdId = cmd.data.cmdId;
        let type = cmd.data.type;
        let user: ADHOCCAST.Cmds.IUser = cmd.data.props.user;     
        let dataExtra = cmd.data.extra;   
        console.log(cmdId);
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
            case ADHOCCAST.Cmds.ECommandId.adhoc_hello:            
            case ADHOCCAST.Cmds.ECommandId.room_close:
            case ADHOCCAST.Cmds.ECommandId.room_leave:            
            case ADHOCCAST.Cmds.ECommandId.room_hello:
            case ADHOCCAST.Cmds.ECommandId.stream_room_hello:

            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstreaminactive:

                break;
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstream:   
                console.log(user.extra)                 

                break;
            case ADHOCCAST.Cmds.ECommandId.user_state_onchange:   
                this.onUserStateChange(cmd);
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:   

                console.log( 'network disconneted: ' , dataExtra)
                break;
            default:
                break;
        }
    }    

    onUserStateChange(cmd: ADHOCCAST.Cmds.Common.ICommand){
        let me = this.conn.rooms.getLoginRoom().me().item;
        let user = cmd.data.props.user as ADHOCCAST.Cmds.IUser;
        if (me.id != user.id) {
            let values = user.extra as ADHOCCAST.Cmds.Common.Helper.IStateChangeValues
            if (ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.chgStates, ADHOCCAST.Dts.EUserState.stream_room_sending) && 
                ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.newStates, ADHOCCAST.Dts.EUserState.stream_room_sending)) {
                this.recvUserStream(cmd.instanceId, user)
            }
        }
    }
    recvUserStream(instanceId: string, user: ADHOCCAST.Cmds.IUser): Promise<any> {
        return new Promise((resolve, reject) => {
            if (ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(user.states, ADHOCCAST.Dts.EUserState.stream_room_sending)) {
                let toUser = {
                    id: user.id,
                    room: {
                        id: ADHOCCAST.Services.Cmds.User.getStreamRoomId(user)
                    }                        
                }
                ADHOCCAST.Services.Cmds.StreamRoomJoin.joinAndHelloAndReady(instanceId, toUser)
                .then(data => {  

                    resolve(data)
                })
                .catch(err => {
                    reject(err)    
                })
            }  else {
                reject('user has not sending stream')
            }
            
        })
   
    }

    render() {     

    }

    onCommand_TalkTo(cmd: ADHOCCAST.Cmds.CommandReq) {
        let data = cmd.data;
        let user = data.props.user;
        let talk = user.nick ? user.nick + '（' + user.sid + '）' : user.sid
        talk += '：' + user.extra as string;
        console.log(talk)
    }    

}


class Test {
    instanceId: string;
    conn: ADHOCCAST.Connection;
    constructor() {
        this.init();
    }
    init() {
        this.instanceId = ADHOCCAST.Cmds.Common.Helper.uuid();

        let organization = 'test';
        
        // let signalerBase = window.location.origin + window.location.pathname;  
        let signalerBase = 'http://127.0.0.1:13670';  
        signalerBase = signalerBase[signalerBase.length - 1] === '/' ? signalerBase.substr(0, signalerBase.length - 1) : signalerBase;
        // signalerUrl = signalerUrl + (organization ? '/' + organization : '');
        
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            signalerBase: signalerBase,
            namespace: organization
        }
        this.conn = ADHOCCAST.Connection.getInstance(connParams);
    }    
    login() {
        return this.conn.login()
    }

}

new Main();

// for (let idx = 0; idx < 20; idx++) {
//     console.log(idx);
//     let test = new Preview();
//     test.conn.login()
//     .then(() => {
//         console.log('登录成功', idx);
//         // return;

//         setInterval(() => {
                        
//             // ADHOCCAST.Services.Modules.Rooms.getRecvStreams(test.conn.rooms).forEach(streams => {
//             //     streams.recvs.values().forEach(stream => {
//             //         stream.getTracks().forEach(track => {
//             //             let rtc = streams.peer.rtc;
//             //             rtc.getStats(track)
//             //             .then(data => {
//             //                 data.forEach((value, key) => {
//             //                     console.log('4444444444', value, key)
//             //                 })
                            
//             //             })
//             //         })
//             //     })
//             // })


//         }, 1000);

       


//     })
//     .catch(err => {
//         console.error('Login failed: ',err)
//     })           
// }



