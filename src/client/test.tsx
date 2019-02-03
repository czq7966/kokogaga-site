import Es6ObjectAssign = require('es6-object-assign');
Es6ObjectAssign.polyfill();
import "url-search-params-polyfill";
import "webrtc-adapter";
import "./index.css"

import * as ADHOCCAST from '../../../adhoc-cast-connection/src/main/dts'
import React = require('react');
import ReactDOM = require('react-dom');
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


        this.state = {
        };

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
        this.conn.dispatcher.eventEmitter.addListener(ADHOCCAST.Cmds.ECommandDispatchEvents.onDispatched, this.onDispatched_Command)
        this.conn.dispatcher.eventEmitter.addListener(ADHOCCAST.Cmds.ECommandDispatchEvents.onBeforeDispatched, this.onBeforeDispatched_Command)
        this.conn.dispatcher.eventEmitter.addListener(ADHOCCAST.Cmds.ECommandEvents.onCommand, this.onCommand_Command)
    }
    unInitEvents() {
        this.conn.dispatcher.eventEmitter.removeListener(ADHOCCAST.Cmds.ECommandDispatchEvents.onDispatched, this.onDispatched_Command);
        this.conn.dispatcher.eventEmitter.removeListener(ADHOCCAST.Cmds.ECommandDispatchEvents.onBeforeDispatched, this.onBeforeDispatched_Command)
        this.conn.dispatcher.eventEmitter.removeListener(ADHOCCAST.Cmds.ECommandEvents.onCommand, this.onCommand_Command)
    }

    onDispatched_Command = (cmd: ADHOCCAST.Cmds.Common.ICommand) => {
        cmd.preventDefault = false;
        let cmdId = cmd.data.cmdId;
        let type = cmd.data.type;
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
            case ADHOCCAST.Cmds.ECommandId.adhoc_hello:            
            case ADHOCCAST.Cmds.ECommandId.room_hello:
            case ADHOCCAST.Cmds.ECommandId.stream_room_hello:
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                this.setState({})
                break;
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstream:     
                let user = cmd.data.props.user as ADHOCCAST.Cmds.IUser;
                this.setState({
                    stream: user.extra
                })
                break;
            default:
                break;
        }
    }

    onBeforeDispatched_Command = (cmd: ADHOCCAST.Cmds.Common.ICommand) => {
    
    }   
    onCommand_Command = (data: ADHOCCAST.Cmds.ICommandData<ADHOCCAST.Cmds.ICommandReqDataProps> )  => {
        let cmdId = data.cmdId;
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstream:
                // console.log('111111111111111')
                // this.setState({
                //     stream: data.props.user.extra
                // })
                break;
            default:
                break;
        }        
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
                                <p>{display}, {opened}</p>
                                <button onClick = {onSendingClick}  >{sending}</button>
                            </div>)
            })

        }
        

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
