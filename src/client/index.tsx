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
    roomid?: string
    info?: string
    stream?: any;
    iceState?: string;
    offline?: boolean
    user?: ADHOCCAST.Modules.IUser
}
export interface IPreviewProp {

}


export class Preview extends React.Component<IPreviewProp, IPreviewState> {
    params: URLSearchParams;
    state: IPreviewState;
    conn: ADHOCCAST.Connection;
    reJoinTimer: number;
    elemVideo: HTMLVideoElement;

    constructor(props) {
        super(props)
        this.params = new URLSearchParams(location.search);
        let signalerUrl = window.location.origin;        
        // signalerUrl = 'http://192.168.252.87:13170'
        // this.conn = new ADHOCCAST.Connection(signalerUrl, '');

        this.state = {
            roomid: this.params.get('roomid'),
            info:'loading...'
        };

        this.initEvents();

    }
    destroy() {
        this.unInitEvents();
        this.conn.close();
        delete this.conn;        
    }   
    componentDidMount() {
        this.doJoinRoom();
        this.elemVideo = document.getElementById('preview-video') as HTMLVideoElement;
    }
    componentWillUnmount() {
        this.destroy();
    }
    componentDidUpdate() {
        this.elemVideo = document.getElementById('preview-video') as HTMLVideoElement;
    }

    initEvents() {
        window.addEventListener('offline', this.onOffline, false);
        window.addEventListener('online', this.onOnline, false);
        this.conn.eventEmitter.addListener(ADHOCCAST.Dts.EClientSocketEvents.disconnect, this.onDisconnect)
    }
    unInitEvents() {
        this.conn.eventEmitter.removeListener(ADHOCCAST.Dts.EClientSocketEvents.disconnect, this.onDisconnect)
        window.removeEventListener('offline', this.onOffline, false);
        window.removeEventListener('online', this.onOnline, false);        
    }

    render() {     
        let isSharing = this.state.stream && (this.state.iceState == "connected" || this.state.iceState == "completed");
        return (
            <div >
                {
                    isSharing ? 
                        <div>
                            <video
                                id="preview-video"
                                autoPlay
                                playsInline
                                width="100%"
                                src = {URL.createObjectURL(this.state.stream)}
                                onMouseDown = {this.onVideoMouseEvent}
                                onMouseUp = {this.onVideoMouseEvent}
                                onMouseEnter = {this.onVideoMouseEvent} 
                                onMouseLeave = {this.onVideoMouseEvent}
                                onMouseMove = {this.onVideoMouseEvent}
                                onMouseOver = {this.onVideoMouseEvent}
                                onMouseOut = {this.onVideoMouseEvent}
                                onWheel = {this.onVideoMouseEvent}
                                // onTouchStart = {this.onVideoTouchStart}
                                // onTouchMove = {this.onVideoTouchMove}
                                // onTouchEnd = {this.onVideoTouchEnd}
                                // onTouchCancel = {this.onVideoTouchCancel}
                            >
                            </video>
                        
                        </div> 
                        :
                        <div id="preview-header">
                            <div id="preview-room">     
                                <hr></hr>                   
                                <div><span>Enter Connection ID：</span>
                                    <input  id="preview-roomid" ></input>
                                    <button id="preview-go">Go</button>
                                </div>
                            </div>    
                            <div>            
                                <hr></hr>            
                                <h2 id="preview-info">loading...</h2>
                                <hr></hr>
                            </div>
                        </div>
                }
            </div>            
        )

        // let isSharing = this.state.stream && (this.state.iceState == "connected" || this.state.iceState == "completed");
        // this.elemInfo.innerText = this.state.info;
        // this.elemHeader.style.display = isSharing ? "none" : "visible"
    }

    onDisconnect = (reason) => {
        if (!this.state.offline) {
            this.onOnline();
        }
    }
    onOffline = () => {
        this.setState({
            info: 'Off line!',
            offline: true,
            stream: null
        })
    }
    onOnline = () => {
        let search = '';
        let roomid = this.state.roomid && this.state.roomid.length > 0 ? this.state.roomid : '';      
        this.params.forEach((value, key) => {
            let param = '';
            if (key == 'roomid') {
                roomid = roomid ? roomid : value
            } else {                
                param = key + '=' + value;                        
            }
            search = search ? search + '&'+ param : param;
        })
        roomid = roomid ? 'roomid='+roomid : '';
        search = search ? '?' + search : '';
        roomid = roomid ? (search ? '&' + roomid : '?' + roomid) : '';
        search =  search + roomid;
        
        let href = window.location.origin + window.location.pathname + search;
        window.location.href =  href;
    }
    onRecvStream = (stream: MediaStream, user: ADHOCCAST.Modules.IUser) => {                
        console.log('on recv stream');
        console.dir(stream)
        this.setState({
            user: user,
            info: 'waiting stream...',
            stream: stream,            
        })
    }

    onIceConnectionStateChange = (ev: Event, user: ADHOCCAST.Modules.IUser) => {
        let peer = ev.target as RTCPeerConnection;
        this.setState({
            iceState: peer.iceConnectionState,
            info: 'waiting p2p...' + peer.iceConnectionState,            
        })
        // this.state.iceState = peer.iceConnectionState;
        // this.state.info = 'waiting p2p...' + peer.iceConnectionState;
        // this.render();
        // this.doPlay();
    }
    doPlay() {
        //"new" | "checking" | "connected" | "completed" | "disconnected" | "failed" | "closed";
        // if (this.state.stream && (this.state.iceState == "connected" || this.state.iceState == "completed")) {
        //     this.state.info = 'sharing...';
        //     setTimeout(() => {
        //         this.elemVideo.srcObject = this.state.stream;
        //         // this.elemVideo.src = URL.createObjectURL(this.state.stream);
        //     }, 100)
        //     this.render();
        // }
    }
    doGo = () => {
        // this.state.roomid = this.elemInput.value.trim();
        if (this.state.roomid) {
            this.onOnline();
        }
    }

    doJoinRoom = () => {        
        if (this.state.roomid && this.state.roomid.length > 0) {
            this.setState({
                info : 'checking connection: ' + this.state.roomid
            })

            let query = {
                roomid: this.state.roomid,
                password: '',
            }                    

            this.conn.joinRoom(query)
            .then(() => {
                this.state.info = 'joined, waiting sharing! ';
                let room = this.conn.rooms.getRoom(this.state.roomid);
                room.eventEmitter.addListener(ADHOCCAST.ERTCPeerEvents.onrecvstream, this.onRecvStream)  
                room.eventEmitter.addListener(ADHOCCAST.ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange)  
            })
            .catch(msg => {
                this.setState({
                    info : 'waiting for connection(' + this.state.roomid +'): ' + msg
                })
                this.reJoinTimer = window.setTimeout(() => {
                    this.doJoinRoom()
                }, 3000)
            })        
        } else {
            this.state.info = 'Please enter connection id and Go';
            this.setState({
                info : 'Please enter connection id and Go'
            })            
        }

    }    

    // _mouseDownEvent: ADHOCCAST.IMouseEvent = {
    //     type: ADHOCCAST.EInputDeviceMouseType.mouseDown,
    //     point: {
    //         x: 0,
    //         y: 0,
    //     }
    // }
    // onVideoMouseDown = (ev: React.MouseEvent) => { 
    //     console.log('onVideoMouseDown:', ev, ev.button, ev.buttons, ev.clientX, ev.clientY, ev.type);
    //     let user = this.state.user;
    //     let event = this._mouseDownEvent;
    //     event.point.x = ev.clientX,
    //     event.point.y = ev.clientY
    //     event.point.Button = ev.button == 0 ? 'left': ev.button == 1 ? 'middle' : ev.button == 2 ? 'right' : 'none';
    //     user.peer.input.sendEvent(event)
    // }
    // _mouseUpEvent: ADHOCCAST.IMouseEvent = {
    //     type: ADHOCCAST.EInputDeviceMouseType.mouseUp,
    //     point: {
    //         x: 0,
    //         y: 0,
    //     }
    // }
    // onVideoMouseUp = (ev: React.MouseEvent) => { 
    //     console.log('onVideoMouseUp:', ev) 
    // }
    // onVideoMouseEnter = (ev: React.MouseEvent) => { console.log('onVideoMouseEnter:', ev) }
    // onVideoMouseLeave = (ev: React.MouseEvent) => { console.log('onVideoMouseLeave:', ev) }
    // onVideoMouseMove = (ev: React.MouseEvent) => { 
    //     // console.log('onVideoMouseMove:', ev) 
    // }
    // onVideoMouseOver = (ev: React.MouseEvent) => { console.log('onVideoMouseOver:', ev) }
    // onVideoMouseOut = (ev: React.MouseEvent) => { console.log('onVideoMouseOut:', ev) }
    // onVideoWheel = (ev: React.WheelEvent) => { console.log('onVideoWheel:', ev) }

    // onVideoTouchStart = (ev: React.TouchEvent) => { console.log('onVideoTouchStart:', ev) }
    // onVideoTouchMove = (ev: React.TouchEvent) => { console.log('onVideoTouchMove:', ev) }
    // onVideoTouchEnd = (ev: React.TouchEvent) => { console.log('onVideoTouchEnd:', ev) }
    // onVideoTouchCancel = (ev: React.TouchEvent) => { console.log('onVideoTouchCancel:', ev) }

    onVideoMouseEvent = (ev: React.MouseEvent) => {        
        let type = ADHOCCAST.EInputDeviceMouseType[ev.type];
        if (type) {
            let user = this.state.user;
            let event: ADHOCCAST.IMouseEvent = {
                type: type,
                x:  ev.clientX,
                y:  ev.clientY,
                destX: (ev.target as HTMLVideoElement).offsetWidth,
                destY: (ev.target as HTMLVideoElement).offsetHeight,
                button: ev.button == 0 ? 'left': ev.button == 1 ? 'middle' : ev.button == 2 ? 'right' : 'none',
                clickCount:  ev.buttons
            }
            user.peer.input.sendEvent(event)            
        }        
        ev.preventDefault();
    }



}

let rootEl = document.getElementById('root');
rootEl && 
ReactDOM.render(
    <Preview/>
, rootEl);
