import { ADHOCCAST } from './libex'
import { Main } from './main';
import { timingSafeEqual } from 'crypto';

export class Receiver  {
    instanceId: string
    main: Main;
    params: URLSearchParams;
    conn: ADHOCCAST.Connection;
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;
    streamUser: ADHOCCAST.Cmds.IUser;

    constructor(main: Main) {
        this.main = main;
        this.instanceId = ADHOCCAST.Cmds.Common.Helper.uuid();
        let signalerBase = "https://mdm.hk.101.com:13670";
        let organization = "promethean";        
        
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
            case ADHOCCAST.Cmds.ECommandId.adhoc_hello:            
            case ADHOCCAST.Cmds.ECommandId.room_close:
            case ADHOCCAST.Cmds.ECommandId.room_leave:            
            case ADHOCCAST.Cmds.ECommandId.room_hello:
            case ADHOCCAST.Cmds.ECommandId.stream_room_hello:
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
                console.log(this.streamUser);
                if (!!this.streamUser && user.id == this.streamUser.id)
                    this.inactiveStream();
                break;
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstreaminactive:
                break;
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstream:   
                this.stream_webrtc_onrecvstream(cmd)
                break;
            case ADHOCCAST.Cmds.ECommandId.user_state_onchange:   
                this.onUserStateChange(cmd);
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:   
                this.inactiveStream();
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
                ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.newStates, ADHOCCAST.Dts.EUserState.stream_room_sending) &&
                !this.streamUser ) {
                this.recvUserStream(cmd.instanceId, user)
            } else {
                if (ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.chgStates, ADHOCCAST.Dts.EUserState.stream_room_sending) && 
                    !ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.newStates, ADHOCCAST.Dts.EUserState.stream_room_sending) && 
                    this.streamUser && this.streamUser.id == user.id) {                
                        this.inactiveStream();                        
                }
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

    stream_webrtc_onrecvstream(cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let user = cmd.data.props.user as ADHOCCAST.Cmds.IUser;
        let owner = this.conn.rooms.getRoom(user.room.id).owner().item;
        this.streamUser = Object.assign({}, owner);
        this.streamUser.extra = user.extra;
        this.main.turner.turnStream(this.streamUser.extra);
    }


    login(): Promise<any>{
        let user: ADHOCCAST.Cmds.IUser = {
            id: null,
            room: {
                id: "promethean_123456"
            }
        }
        return this.conn.login(user)
        .then(v => {
            console.log('111111111111111111111');
        });
    }

    getRecvStream(): MediaStream {       
        return this.streamUser && this.streamUser.extra;
    }
    inactiveStream() {
        console.log("5555555555");
        if (this.streamUser) {
            let user = this.streamUser;
            let stream = user.extra as MediaStream;
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop && track.stop();
                    track.dispatchEvent({"type": "ended"} as any);
                })
                stream.stop && stream.stop();
                stream.dispatchEvent({"type": "inactive"} as any);
                stream = null;
            }   
            this.streamUser = null;         
        }
    }
}




