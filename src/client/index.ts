require('es6-object-assign').polyfill();
import "webrtc-adapter";
import { Connection } from "./connection/connection";
import { EClientBaseEvents, IUserQuery } from "./connection/client";
import { IUser, User } from "./connection/user";
import { ERTCPeerEvents, Peer } from "./connection/peer";


export interface IPreviewState {
    roomid?: string
    info?: string
    stream?: any;
    iceState?: string;
    offline?: boolean
    trackUser?: IUser
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
    elemLog: HTMLSpanElement;
    

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
        this.state.trackUser = user;
        this.state.info = 'waiting track...';
        this.state.stream = ev.streams[0];
        this.render();        
        this.doPlay();        
    }

    onIceConnectionStateChange = (ev: Event, user: IUser) => {
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
                this.elemVideo.srcObject = this.state.stream;
            }, 0)
            this.render();
        }
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
                room.eventEmitter.addListener(ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange)  
                
                this.render();          
            })
            .catch(msg => {
                this.state.info = msg;
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



function Test() {
    var RTCPeerEvents = {
        onconnectionstatechange: 'connectionstatechange',
        ondatachannel: 'datachannel',
        onicecandidate : 'icecandidate',
        onicecandidateerror: 'icecandidateerror',
        oniceconnectionstatechange : 'iceconnectionstatechange',
        onicegatheringstatechange : 'icegatheringstatechange',
        onnegotiationneeded : 'negotiationneeded',
        onsignalingstatechange : 'signalingstatechange',
        onstatsended : 'statsended',
        ontrack: 'track',
        onrecvstreaminactive : 'recvstreaminactive',
        onsendstreaminactive : 'sendstreaminactive'
    }


    var config: RTCConfiguration = {
        iceServers: [
            {
                'urls': [
                    'stun:webrtcweb.com:7788', // coTURN
                    // 'stun:webrtcweb.com:7788?transport=udp', // coTURN
                ],
                'username': 'muazkh',
                'credential': 'muazkh'
            },
        ],
        iceTransportPolicy: "all"
    }
    var rtc1 = new webkitRTCPeerConnection(config)
    var rtc2 = new webkitRTCPeerConnection(config)
    console.log(rtc1)
    console.log(rtc2)
    Object.keys(RTCPeerEvents).forEach(key => {
        let value = RTCPeerEvents[key];
        let event = (...args: any[]) => {
            console.log('rtc1 PeerEvent:', value, ...args)
        }

        rtc1['on'+value] = event;
    })

    Object.keys(RTCPeerEvents).forEach(key => {
        let value = RTCPeerEvents[key];
        let event = (...args: any[]) => {
            console.log('rtc2 PeerEvent:', value, ...args)
        }

        rtc2['on'+value] = event;
    })


    rtc1.onicecandidate = (candidate) => {
        console.log('rtc1 onicecandidate:', candidate)    
    }
    rtc1.onicecandidate = (candidate) => {
        console.log('rtc2 onicecandidate:', candidate)    
    }

    (rtc1 as any).createOffer((sdp) => {
        console.log('rtc1 createOffer', sdp);
        (rtc1 as any).setLocalDescription(sdp, () => {
            (rtc1 as any).updateIce();
            console.log('rtc1 setLocalDescription');
            (rtc2 as any).setRemoteDescription(sdp, () => {
                    console.log('rtc2 setRemoveDescription');
                    (rtc2 as any).createAnswer((sdp) => {
                        console.log('rtc2 createAnswer', sdp);
                        rtc2.setLocalDescription(sdp);
                        rtc1.setRemoteDescription(sdp);
                    })

                }, () => {

                });
        }, () => {console.log('222')})
    

    }, (err) => {
        console.log(err)

    });
}
