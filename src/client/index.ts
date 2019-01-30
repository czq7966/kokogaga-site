import Es6ObjectAssign = require('es6-object-assign');
Es6ObjectAssign.polyfill();
import "url-search-params-polyfill";
import "webrtc-adapter";
import "./index.css"
import './test'

import * as ADHOCCAST from '../../../adhoc-cast-connection/src/main/dts'
ADHOCCAST.Config.platform = ADHOCCAST.EPlatform.browser;

export interface IPreviewState {
    roomid?: string
    info?: string
    stream?: any;
    iceState?: string;
    offline?: boolean
    user?: ADHOCCAST.Modules.IUser
}


export class Preview {
    touchMode: boolean;
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
        // this.conn = new ADHOCCAST.Connection(signalerUrl, 'test');

        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: ADHOCCAST.Cmds.Common.Helper.uuid(),
            url: signalerUrl
        }
        this.conn = ADHOCCAST.Connection.getInstance(connParams);

        this.state = {
            roomid: this.params.get('roomid'),
            info:'loading...'
        };

        this.initElems();
        this.initEvents();

        this.render();
        // this.doJoinRoom();
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

        this.elemVideo.onmousedown = this.onVideoMouseEvent
        this.elemVideo.onmouseup = this.onVideoMouseEvent
        this.elemVideo.onmouseenter = this.onVideoMouseEvent
        this.elemVideo.onmouseleave = this.onVideoMouseEvent
        this.elemVideo.onmousemove = this.onVideoMouseEvent
        this.elemVideo.onmouseover = this.onVideoMouseEvent
        this.elemVideo.onmouseout = this.onVideoMouseEvent
        this.elemVideo.onwheel = this.onVideoMouseEvent
        this.elemVideo.ontouchstart = this.onVideoTouchEvent
        this.elemVideo.ontouchmove = this.onVideoTouchEvent
        this.elemVideo.ontouchend = this.onVideoTouchEvent
        this.elemVideo.ontouchcancel = this.onVideoTouchEvent
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
    onRecvStream = (stream: MediaStream, user: ADHOCCAST.Modules.IUser) => {                
        console.log('on recv stream');
        console.dir(stream)
        this.state.user = user;
        this.state.info = 'waiting stream...';
        this.state.stream = stream;
        this.render();        
        this.doPlay();        
    }

    onIceConnectionStateChange = (ev: Event, user: ADHOCCAST.Modules.IUser) => {
        let peer = ev.target as RTCPeerConnection;
        this.state.iceState = peer.iceConnectionState;
        this.state.info = 'waiting p2p...' + peer.iceConnectionState;
        this.render();
        this.doPlay();
    }

    onVideoMouseEvent = (ev: MouseEvent) => {   
        let type = ADHOCCAST.EInputDeviceMouseType[ev.type];
        let user = this.state.user;
        if (!this.touchMode && type && user ) {
            let event: ADHOCCAST.IMouseEvent = {
                type: type,
                x:  ev.clientX,
                y:  ev.clientY,
                deltaX: (ev as WheelEvent).deltaX,
                deltaY: (ev as WheelEvent).deltaY,
                destX: (ev.target as HTMLVideoElement).offsetWidth,
                destY: (ev.target as HTMLVideoElement).offsetHeight,
                button: ev.button == 0 ? 'left': ev.button == 1 ? 'middle' : ev.button == 2 ? 'right' : 'none',
                clickCount:  ev.buttons
            }
            user.peer.input.sendEvent(event)
            ev.preventDefault();
        }        
        
    }

    onVideoTouchEvent = (ev: TouchEvent) => {
        this.touchMode = true;
        let type = ADHOCCAST.EInputDeviceTouchType[ev.type];
        let user = this.state.user;
        if (type && user ) {       
            let touches: ADHOCCAST.ITouchPoint[] = [];          
            let changedTouches: ADHOCCAST.ITouchPoint[] = [];
            for (let i = 0; i < ev.touches.length; i++) {
                let touch = ev.touches[i];
                touches.push({
                    x: touch.clientX,
                    y: touch.clientY,
                    radiusX: touch.radiusX,
                    radiusY: touch.radiusY,
                    rotationAngle: touch.rotationAngle,
                    force: touch.force,
                    id: touch.identifier
                })
            }
            for (let i = 0; i < ev.changedTouches.length; i++) {
                let touch = ev.changedTouches[i];
                changedTouches.push({
                    x: touch.clientX,
                    y: touch.clientY,
                    radiusX: touch.radiusX,
                    radiusY: touch.radiusY,
                    rotationAngle: touch.rotationAngle,
                    force: touch.force,
                    id: touch.identifier
                })
            }            
            
            let event: ADHOCCAST.ITouchEvent = {
                type: type,
                touches: touches,
                changedTouches: changedTouches,
                destX: (ev.target as HTMLVideoElement).offsetWidth,
                destY: (ev.target as HTMLVideoElement).offsetHeight,
            }
            user.peer.input.sendEvent(event)
        }    

        ev.preventDefault();
    }

    doPlay() {
        //"new" | "checking" | "connected" | "completed" | "disconnected" | "failed" | "closed";
        if (this.state.stream && (this.state.iceState == "connected" || this.state.iceState == "completed")) {
            this.state.info = 'sharing...';
            setTimeout(() => {
                this.elemVideo.oncanplay = () => {
                    this.elemVideo.play().catch((err) => {
                        console.error(err)
                        this.elemVideo.muted = true;
                        this.elemVideo.play();
                    })
                }
                this.elemVideo.srcObject = this.state.stream;
            }, 100)
            this.render();
        }
    }
    doGo = () => {
        // this.state.roomid = this.elemInput.value.trim();
        // if (this.state.roomid) {
        //     this.onOnline();
        // }

        this.doGoLogin();
    }
    doGoLogin = () => {     
        this.conn.isLogin()  ?
            this.conn.logout() :
            this.conn.login();        
    }
    doLogout = () => {
        this.conn.logout();
    }

    doJoinRoom = () => {        
        if (this.state.roomid && this.state.roomid.length > 0) {
            this.state.info = 'checking connection: ' + this.state.roomid;
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

