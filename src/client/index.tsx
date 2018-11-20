// import "webrtc-adapter"
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
    // connection: Connection;


    constructor(props) {
        super(props);  
        this.params = new URLSearchParams(window.location.search);        
        this.conn = new Connection('http://192.168.251.97:3000');
        this.initEvents();
        let roomid = this.params.get('roomid') || prompt('Enter Room ID:');        
        this.state = {
            roomid: roomid,
            info:'loading...'
        };
        this.doJoinRoom();
    }
    destroy() {
        this.unInitEvents();
    }   

    componentDidMount() {

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
        return (
            <div>
                {this.state.info ?
                    <h1>{this.state.info}</h1>
                    :
                    null
                }
                
                {
                    this.state.stream && !this.state.offline ? 
                        <video id="video" autoPlay playsinline muted width="100%" height="100%" ></video>
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
    doJoinRoom() {
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
            this.setState({ info: msg})
            setTimeout(() => {
                this.doJoinRoom()
            }, 2000)
        })        
    }
}


let rootEl = document.getElementById('root');

rootEl && 
ReactDOM.render(
    <Preview/>
, rootEl);
