import Es6ObjectAssign = require('es6-object-assign');
Es6ObjectAssign.polyfill();
import "url-search-params-polyfill";
import "webrtc-adapter";
import "./index.css"

import React = require('react');
import ReactDOM = require('react-dom');

import { ADHOCCAST } from './libex'
import { CompLayout } from './comps';
ADHOCCAST.Config.platform = ADHOCCAST.EPlatform.browser;

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
        let signalerUrl = window.location.origin + window.location.pathname;  
        signalerUrl = signalerUrl[signalerUrl.length - 1] === '/' ? signalerUrl.substr(0, signalerUrl.length - 1) : signalerUrl;
        
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
        this.conn.close();
        delete this.params;
        delete this.conn;        
    }   
    componentDidMount() {
        this.conn.login()
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
            case ADHOCCAST.Cmds.ECommandId.room_hello:
            case ADHOCCAST.Cmds.ECommandId.stream_room_hello:
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
            case ADHOCCAST.Cmds.ECommandId.room_close:

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
                ADHOCCAST.Services.Cmds.StreamRoomJoin.joinAndHello(instanceId, toUser)
                .then(data => {                        
                    ADHOCCAST.Services.Cmds.StreamWebrtcReady.ready(instanceId, toUser)
                    .then(() => {
                        resolve()
                    })
                    .catch(err => {
                        reject(err)
                    })
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
        let onSendingClick = (ev) => {
            users.keys().forEach(key => {
                let mUser = users.get(key);
                if (mUser.states.isset(ADHOCCAST.Dts.EUserState.stream_room_sending)) {
                    let toUser = {
                        id: mUser.item.id,
                        room: {
                            id: ADHOCCAST.Services.Cmds.User.getStreamRoomId(mUser.item)
                        }                        
                    }
                    ADHOCCAST.Services.Cmds.StreamRoomJoin.joinAndHello(mUser.instanceId, toUser)
                    .then(data => {                        
                        ADHOCCAST.Services.Cmds.StreamWebrtcReady.ready(mUser.instanceId, toUser);
                    })
                    .catch(err => {

                    })

                    
                }
            })   
        }
        let onOpenedClick = (ev) => {
            users.keys().forEach(key => {
                let mUser = users.get(key);
                if (mUser.states.isset(ADHOCCAST.Dts.EUserState.stream_room_sending)) {
                    let mRoom = ADHOCCAST.Services.Modules.User.getStreamRoom(mUser);
                    mRoom.me().peer.getRtc(false).close();
                }
            })             
        }


        let items = [];
        let room = ADHOCCAST.Services.Modules.Rooms.getLoginRoom(this.instanceId);
        let users = room ? room.users : null
        if (users) {
            users.keys().forEach(key => {
                let mUser = users.get(key);
                let user = mUser.item;
                let display = user.nick || user.id;
                let opened = mUser.states.isset(ADHOCCAST.Dts.EUserState.stream_room_opened) ? 'true' : 'false';
                let sending = mUser.states.isset(ADHOCCAST.Dts.EUserState.stream_room_sending) ? 'true' : 'false';
                items.push(<div key={key}>
                                <p>{display}, </p>
                                <button onClick = {onOpenedClick}  >{opened}</button>
                                <button onClick = {onSendingClick}  >{sending}</button>
                            </div>)
            })

        }
        return (
            <div>
                <CompLayout conn={this.conn}/>
            </div>

        )

        return (
            <div >
                <div>Users</div>
                <br></br>
                {items}
                {
                    this.state.stream 
                    ?
                        <div>
                            <video
                                id="preview-video"
                                autoPlay
                                playsInline
                                width="100%"
                                src = {URL.createObjectURL(this.state.stream)}
                            >
                            </video>                
                        </div> 
                    :   null
                }

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
