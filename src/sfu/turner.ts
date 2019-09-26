import { ADHOCCAST } from './libex'
import { Main } from './main';

export class Turner  {
    instanceId: string
    main: Main;
    params: URLSearchParams;
    conn: ADHOCCAST.Connection;
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;
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
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
            case ADHOCCAST.Cmds.ECommandId.adhoc_hello:            
            case ADHOCCAST.Cmds.ECommandId.room_close:
            case ADHOCCAST.Cmds.ECommandId.room_leave:            
            case ADHOCCAST.Cmds.ECommandId.room_hello:
            case ADHOCCAST.Cmds.ECommandId.stream_room_hello:
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstreaminactive:
                break;
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstream:   
                break;
            case ADHOCCAST.Cmds.ECommandId.user_state_onchange:                   
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:   
                console.log( 'network disconneted: ' , dataExtra)
                break;
            default:
                break;
        }
    }    

    login(): Promise<any> {
        let user: ADHOCCAST.Cmds.IUser = {
            id: null,
            room: {
                id: "turn"
            }
        }
        return this.conn.login(user)
        .then(v => {
            console.log('22222222222222222222');
        });
    }

    turnStream(stream: MediaStream) {
        let mCurrUser = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(this.instanceId).me();
        ADHOCCAST.Services.Cmds.StreamRoomOpen.open(this.instanceId, mCurrUser.item)
        .then((result) => {                    
            let mStreamRoom = ADHOCCAST.Services.Modules.User.getStreamRoom(mCurrUser);
            let mUser = mStreamRoom.me();
            ADHOCCAST.Services.Cmds.StreamWebrtcStreams.sendingStream(mUser.getPeer().streams, stream);
            stream.addEventListener("inactive", () => {
                ADHOCCAST.Services.Cmds.StreamWebrtcStreams.sendingStream(mUser.getPeer().streams, null);
            })    
        })
    }

}




