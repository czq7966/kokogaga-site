import Es6ObjectAssign = require('es6-object-assign');
Es6ObjectAssign.polyfill();
import "url-search-params-polyfill";
import "webrtc-adapter";
import "./index.css"
// import { Connection } from "../main/connection";
// import { EClientBaseEvents, IUserQuery } from "../main/client";
// import { IUser, User } from "../main/user";
// import { ERTCPeerEvents, Peer } from "../main/peer";

import * as ADHOCCAST from '../../../adhoc-cast-connection'
ADHOCCAST.Config.platform = ADHOCCAST.EPlatform.browser;
ADHOCCAST.AssignWebRTC({});

export interface IPreviewState {
    roomid?: string
    info?: string
    stream?: any;
    iceState?: string;
    offline?: boolean
    trackUser?: ADHOCCAST.IUser
}


export class Preview {
    params: URLSearchParams;
    state: IPreviewState;
    conn: ADHOCCAST.Connection;
    reJoinTimer: number;
    elemInput: HTMLInputElement;
    elemGo: HTMLButtonElement; 
    elemInfo: HTMLElement;
    elemVideo: HTMLVideoElement;
    elemLog: HTMLSpanElement;
    elemRoom: HTMLDivElement;
    elemHeader: HTMLDivElement;
    
    

    constructor() {
        this.params = new URLSearchParams(location.search);
        let signalerUrl = window.location.origin;        
        // signalerUrl = 'http://192.168.252.87:13170'
        this.conn = new ADHOCCAST.Connection(signalerUrl);

        this.state = {
            roomid: this.params.get('roomid'),
            info:'loading...'
        };

        this.initElems();
        this.initEvents();

        this.render();
        this.doJoinRoom();
    }
    destroy() {
        this.unInitEvents();
    }   
    initElems() {
        this.elemInput = document.getElementById("preview-roomid") as HTMLInputElement;
        this.elemGo = document.getElementById("preview-go") as HTMLButtonElement;
        this.elemInfo = document.getElementById("preview-info") as HTMLElement;
        this.elemVideo = document.getElementById("preview-video") as HTMLVideoElement;
        this.elemRoom = document.getElementById("preview-room") as HTMLDivElement;
        this.elemHeader = document.getElementById("preview-header") as HTMLDivElement;

        this.elemInput.value = this.state.roomid || '';        
        this.elemGo.onclick = this.doGo;
    }
    initEvents() {
        window.addEventListener('offline', this.onOffline, false);
        window.addEventListener('online', this.onOnline, false);
        this.conn.eventEmitter.addListener(ADHOCCAST.EClientBaseEvents.disconnect, this.onDisconnect)
    }
    unInitEvents() {
        this.conn.eventEmitter.removeListener(ADHOCCAST.EClientBaseEvents.disconnect, this.onDisconnect)
        window.removeEventListener('offline', this.onOffline, false);
        window.removeEventListener('online', this.onOnline, false);        
    }

    render() {       
        let isSharing = this.state.stream && (this.state.iceState == "connected" || this.state.iceState == "completed");
        this.elemInfo.innerText = this.state.info;
        this.elemHeader.style.display = isSharing ? "none" : "visible"
    }

    onDisconnect = (reason) => {
        if (!this.state.offline) {
            this.onOnline();
        }
    }
    onOffline = () => {
        this.state.info = 'Off line';
        this.state.offline = true;
        this.render();
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
    onRecvStream = (stream: MediaStream, user: ADHOCCAST.IUser) => {                
        console.log('on recv stream');
        console.dir(stream)
        this.state.trackUser = user;
        this.state.info = 'waiting stream...';
        this.state.stream = stream;
        this.render();        
        this.doPlay();        
    }

    onIceConnectionStateChange = (ev: Event, user: ADHOCCAST.IUser) => {
        let peer = ev.target as RTCPeerConnection;
        this.state.iceState = peer.iceConnectionState;
        this.state.info = 'waiting p2p...' + peer.iceConnectionState;
        this.render();
        this.doPlay();
    }
    doPlay() {
        //"new" | "checking" | "connected" | "completed" | "disconnected" | "failed" | "closed";
        if (this.state.stream && (this.state.iceState == "connected" || this.state.iceState == "completed")) {
            this.state.info = 'sharing...';
            setTimeout(() => {
                // this.elemVideo.srcObject = this.state.stream;
                this.elemVideo.src = URL.createObjectURL(this.state.stream);
            }, 100)
            this.render();
        }
    }
    doGo = () => {
        this.state.roomid = this.elemInput.value.trim();
        if (this.state.roomid) {
            this.onOnline();
        }
    }

    doJoinRoom = () => {        
        if (this.state.roomid && this.state.roomid.length > 0) {
            this.state.info = 'checking connection: ' + this.state.roomid;
            let query: ADHOCCAST.IUserQuery = {
                roomid: this.state.roomid,
                password: '',
            }                    

            this.conn.joinRoom(query)
            .then(() => {
                this.state.info = 'joined, waiting sharing! ';
                let room = this.conn.rooms.getRoom(this.state.roomid);
                room.eventEmitter.addListener(ADHOCCAST.ERTCPeerEvents.onrecvstream, this.onRecvStream)  
                room.eventEmitter.addListener(ADHOCCAST.ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange)  
                
                this.render();          
            })
            .catch(msg => {
                this.state.info = 'waiting for connection: ' + this.state.roomid;
                this.reJoinTimer = window.setTimeout(() => {
                    this.doJoinRoom()
                }, 3000)
                this.render();
            })        
        } else {
            this.state.info = 'Please enter connection id and Go';
        }
        this.render();
    }    
}

new Preview();

export class Test {
    conn: ADHOCCAST.Connection;
    constructor() {
        this.conn = new ADHOCCAST.Connection('');
        console.dir(this.conn)

    }

}

// new Test();