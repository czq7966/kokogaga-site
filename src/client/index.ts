import "webrtc-adapter"
import { Connection } from "./connection/connection";
import { EClientBaseEvents, IUserQuery } from "./connection/client";
import { IUser } from "./connection/user";
import { ERTCPeerEvents } from "./connection/peer";

export interface IPreviewState {
    roomid?: string
    info?: string
    stream?: any;
    offline?: boolean
}

function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}
    


export class Preview {
    state: IPreviewState;
    conn: Connection;
    reJoinTimer: number;
    elemInput: HTMLInputElement;
    elemGo: HTMLButtonElement;
    elemInfo: HTMLElement;
    elemVideo: HTMLVideoElement;
    elemAgent: HTMLSpanElement;
    

    constructor() {
        let signalerUrl = window.location.origin;        
        this.conn = new Connection(signalerUrl);
        this.initElems();
        this.initEvents();
     
        this.state = {
            roomid: getQueryString('roomid'),
            info:'loading...'
        };
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
        this.elemAgent = document.getElementById("preview-agent") as HTMLSpanElement;

        // this.elemInput.onchange = this.onRoomidChange;
        this.elemGo.onclick = this.doJoinRoom;
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
        this.elemInput.value = this.state.roomid || '';
        this.elemInfo.innerText = this.state.info;
    }

    // onRoomidChange = (event: Event) => {
    //     if (this.reJoinTimer) {
    //         clearTimeout(this.reJoinTimer);
    //         this.reJoinTimer = 0;
    //     }
    //     this.state.roomid = this.elemInput.value.trim()
    // }

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
        window.location = window.location
    }
    onTrack = (ev: RTCTrackEvent, user: IUser) => {        
        console.log('on track');
        console.dir(user)
        this.state.info = 'sharing...';
        this.state.stream = ev.streams[0];
        setTimeout(() => {
            this.elemVideo.srcObject = this.state.stream;
        }, 0)
        this.render();        
    }
    doJoinRoom = () => {
        this.state.roomid = this.elemInput.value.trim();
        if (this.state.roomid && this.state.roomid.length > 0) {
            this.state.info = 'checking room: ' + this.state.roomid;
            let query: IUserQuery = {
                roomid: this.state.roomid,
                password: '',
            }        
            this.conn.joinRoom(query)
            .then(() => {
                this.state.info = 'joined, waiting sharing! ';
                let room = this.conn.rooms.getRoom(this.state.roomid);
                room.eventEmitter.addListener(ERTCPeerEvents.ontrack, this.onTrack)  
                this.render();          
            })
            .catch(msg => {
                this.state.info = msg;
                this.reJoinTimer = window.setTimeout(() => {
                    this.doJoinRoom()
                }, 2000)
                this.render();
            })        
        } else {
            this.state.info = 'Please enter connection id and Go';
        }
        this.render();
    }    
}

new Preview();