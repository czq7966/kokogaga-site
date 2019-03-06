import Es6ObjectAssign = require('es6-object-assign');
Es6ObjectAssign.polyfill();
import "url-search-params-polyfill";
import "webrtc-adapter";
import "./index.css"

import React = require('react');
import ReactDOM = require('react-dom');

import { ADHOCCAST } from './libex'
import { CompLayout } from './comps';
ADHOCCAST.Modules.Webrtc.Config.platform = ADHOCCAST.Modules.Webrtc.EPlatform.browser;

export interface IPreviewState {
    stream?: MediaStream;

}
export interface IPreviewProp {

}


export class Preview extends React.Component<IPreviewProp, IPreviewState> {
    instanceId: string
    params: URLSearchParams;
    conn: ADHOCCAST.Connection;
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;
    constructor(props) {
        super(props)

        this.instanceId = ADHOCCAST.Cmds.Common.Helper.uuid();
        this.params = new URLSearchParams(location.search);
        let organization = this.params.get('organization');

        let signalerUrl = window.location.origin + window.location.pathname;  
        signalerUrl = signalerUrl[signalerUrl.length - 1] === '/' ? signalerUrl.substr(0, signalerUrl.length - 1) : signalerUrl;
        signalerUrl = signalerUrl + (organization ? '/' + organization : '');
        
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            url: signalerUrl
        }
        this.conn = ADHOCCAST.Connection.getInstance(connParams);

        this.eventRooter = new ADHOCCAST.Cmds.Common.EventRooter();

        this.state = {};

        this.initEvents();

    }
    destroy() {
        this.unInitEvents();
        this.conn.disconnect();
        delete this.params;
        delete this.conn;        
    }   
    componentDidMount() {
        let user: ADHOCCAST.Cmds.IUser ={
            id: null,
            room: {
                id: this.params.get('roomid')
            }
        }        
        this.conn.login(user)
        .then(() => {
            console.log('登录成功')
        })
        .catch(err => {
            console.error('登录',err)
        })
    }
    componentWillUnmount() {
        this.destroy();
    }
    componentDidUpdate() {

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
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
            case ADHOCCAST.Cmds.ECommandId.adhoc_hello:            
            case ADHOCCAST.Cmds.ECommandId.room_close:
            case ADHOCCAST.Cmds.ECommandId.room_leave:            
            case ADHOCCAST.Cmds.ECommandId.room_hello:
            case ADHOCCAST.Cmds.ECommandId.stream_room_hello:
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:

            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstream:     
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstreaminactive:
            // case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onsignalingstatechange:
                this.setState({})
                break;
            case ADHOCCAST.Cmds.ECommandId.user_state_onchange:   
                this.onUserStateChange(cmd);
                this.setState({})             
                break;

            // case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstream:     
            //     user = cmd.data.props.user as ADHOCCAST.Cmds.IUser;
            //     this.setState({
            //         stream: user.extra
            //     })
            //     break;
            // case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstreaminactive:
            // case ADHOCCAST.Cmds.ECommandId.room_close:
            //     user = cmd.data.props.user as ADHOCCAST.Cmds.IUser;
            //     this.setState({
            //         stream: null
            //     })
            //     break;                
            default:
                break;
        }
    }    

    onUserStateChange(cmd: ADHOCCAST.Cmds.Common.ICommand){
        let user = cmd.data.props.user as ADHOCCAST.Cmds.IUser;
        let values = user.extra as ADHOCCAST.Cmds.Common.Helper.IStateChangeValues
        if (ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.chgStates, ADHOCCAST.Dts.EUserState.stream_room_sending) && 
            ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.newStates, ADHOCCAST.Dts.EUserState.stream_room_sending)) {
            this.recvUserStream(cmd.instanceId, user);
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
        return (
            <div>
                <CompLayout conn={this.conn}/>
            </div>

        )
        // let isSharing = this.state.stream && (this.state.iceState == "connected" || this.state.iceState == "completed");
        // this.elemInfo.innerText = this.state.info;
        // this.elemHeader.style.display = isSharing ? "none" : "visible"
    }


}

let rootEl = document.getElementById('root');
rootEl && 
ReactDOM.render(
    <Preview/>
, rootEl);
