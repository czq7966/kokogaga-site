import "webrtc-adapter"
import React = require("react");
import ReactDOM = require("react-dom");
import { Connection } from "./connection/connection";
import { EClientBaseEvents, IUserQuery } from "./connection/client";
import { IUser } from "./connection/user";
import { ERTCPeerEvents } from "./connection/peer";


export interface PreviewProps {

}

export interface PreviewState {
    roomid?: string
    info?: string
    stream?: any;
    offline?: boolean
}


export class Preview extends React.Component<PreviewProps, PreviewState> {
    conn: Connection;
    params: URLSearchParams;
    reJoinTimer: number;

    constructor(props) {
        super(props);  
        // this.params = new URLSearchParams(window.location.search);        
        // let roomid = this.params.get('roomid') || ''; 
        // let signalerUrl = this.params.get('signaler') || window.location.origin;
        let signalerUrl = window.location.origin;
        this.conn = new Connection(signalerUrl);
        this.initEvents();
     
        this.state = {
            // roomid: roomid,
            info:'loading...'
        };
    }
    destroy() {
        this.unInitEvents();
    }   

    componentDidMount() {
        this.doJoinRoom();
    }
    componentWillUnmount() {
        this.destroy();
    }
    initEvents() {
        window.addEventListener('offline', this.onOffline, false);
        window.addEventListener('online', this.onOnline, false);
        this.conn.eventEmitter.addListener(EClientBaseEvents.disconnect, this.onDisconnect)
    }
    unInitEvents() {
        this.conn.eventEmitter.removeListener(EClientBaseEvents.disconnect, this.onDisconnect)
        window.removeEventListener('offline', this.onOffline, false);
        window.removeEventListener('online', this.onOnline, false);        
    }

    render() {
        let enterRoomid =   <div>
                                <div id="options-div-signaler"><span>Enter Connection ID：</span>
                                    <input value={this.state.roomid} onChange={this.onRoomidChange} ></input>
                                    <button onClick={this.doJoinRoom}>Go</button>
                                </div>

                            </div>
        return (
            <div>
                {enterRoomid}
                {this.state.info ?
                    <h1>{this.state.info}</h1>
                    :
                    null
                }
                
                {
                    this.state.stream && !this.state.offline ? 
                        <video id="video" autoPlay playsInline muted width="100%" height="100%" ></video>
                        : 
                        null
                }                
            </div>             
        )
    }
    open() {

    }

    start() {
    }
    stop() {

    }
    onRoomidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.reJoinTimer) {
            clearTimeout(this.reJoinTimer);
            this.reJoinTimer = 0;
        }
        this.setState({
            roomid: event.target.value.trim()
        })   
    }

    onDisconnect = (reason) => {
        if (!this.state.offline) {
            this.onOnline();
        }
    }
    onOffline = () => {
        this.setState({
            info: 'Off line',
            offline: true
        })

    }
    onOnline = () => {
        window.location = window.location
    }
    onTrack = (ev: RTCTrackEvent, user: IUser) => {        
        console.log('on track');
        console.dir(user)
        this.setState({
            info: 'sharing...',
            stream: ev.streams[0]
        })
        setTimeout(() => {
            var video = document.getElementById('video') as HTMLVideoElement;
            video.srcObject = this.state.stream;
        }, 0)
        
    }
    doJoinRoom = () => {
        if (this.state.roomid && this.state.roomid.length > 0) {
            this.setState({ info: 'checking room: ' + this.state.roomid })
            let query: IUserQuery = {
                roomid: this.state.roomid,
                password: '',
            }        
            this.conn.joinRoom(query)
            .then(() => {
                this.setState({ info: 'joined, waiting sharing! '})
                let room = this.conn.rooms.getRoom(this.state.roomid);
                room.eventEmitter.addListener(ERTCPeerEvents.ontrack, this.onTrack)            
            })
            .catch(msg => {
                this.setState({ info: msg});
                this.reJoinTimer = window.setTimeout(() => {
                    this.doJoinRoom()
                }, 2000)
            })        
        } else {
            this.setState({ info: 'Please enter connection id and Go'});
        }
    }
}


let rootEl = document.getElementById('root');

rootEl && 
ReactDOM.render(
    <Preview/>
, rootEl);
