import { ESignalerMessageType, ISignalerMessage } from "./signaler";
import { Base } from "./bast";
import { IUser } from "./user";
import { IUserQuery } from "./client";

var iceServers = [
    // {
    //     'urls': [
    //         'stun:webrtcweb.com:7788', // coTURN
    //         // 'stun:webrtcweb.com:7788?transport=udp', // coTURN
    //     ],
    //     'username': 'muazkh',
    //     'credential': 'muazkh'
    // },
    // {
    //     'urls': [
    //         'turn:webrtcweb.com:7788', // coTURN 7788+8877
    //         'turn:webrtcweb.com:4455?transport=udp', // restund udp

    //         'turn:webrtcweb.com:8877?transport=udp', // coTURN udp
    //         'turn:webrtcweb.com:8877?transport=tcp', // coTURN tcp
    //     ],
    //     'username': 'muazkh',
    //     'credential': 'muazkh'
    // },
    // {
    //     'urls': [
    //         'stun:stun.l.google.com:19302',
    //         'stun:stun.l.google.com:19302?transport=udp',
    //     ]
    // }
];


var config: RTCConfiguration = {
    iceServers: iceServers,
    iceTransportPolicy: "all"
}



export enum ERTCPeerEvents {
    onconnectionstatechange = 'connectionstatechange',
    ondatachannel = 'datachannel',
    onicecandidate = 'icecandidate',
    onicecandidateerror = 'icecandidateerror',
    oniceconnectionstatechange = 'iceconnectionstatechange',
    onicegatheringstatechange = 'icegatheringstatechange',
    onnegotiationneeded = 'negotiationneeded',
    onsignalingstatechange = 'signalingstatechange',
    onstatsended = 'statsended',
    ontrack = 'track',
    onrecvstreaminactive = 'recvstreaminactive',
    onsendstreaminactive = 'sendstreaminactive'
}

export class Peer extends Base {
    user: IUser
    rtc: RTCPeerConnection
    sendStreams: Array<MediaStream>;
    recvStreams: ReadonlyArray<MediaStream>;
    private _rtcevents;
    constructor(user: IUser) {
        super()
        this.sendStreams = [];
        this._rtcevents = {};
        this.user = user;
        this.rtc = new RTCPeerConnection(config);
        this.initEvents();
    }
    destroy() {                
        this.unInitEvents();
        this.rtc.close();
        delete this._rtcevents
        delete this.rtc;
        delete this.user;
        delete this.sendStreams;
        delete this.recvStreams;
        super.destroy();
    }
    initEvents() {
        [ERTCPeerEvents].forEach(events => {
            Object.keys(ERTCPeerEvents).forEach(key => {
                let value = events[key];
                let event = (...args: any[]) => {
                    // console.log('PeerEvent:', value, ...args)
                    this.eventEmitter.emit(value, ...args)
                }
                this._rtcevents[value] = event;
                this.rtc.addEventListener(value, event)
            })
        })
        this.rtc.addEventListener(ERTCPeerEvents.onicecandidate, this.onIceCandidate)
        this.eventEmitter.addListener(ESignalerMessageType.offer, this.onOffer)
        this.eventEmitter.addListener(ESignalerMessageType.answer, this.onAnswer)
        this.eventEmitter.addListener(ESignalerMessageType.candidate, this.onCandidate)
        this.eventEmitter.addListener(ESignalerMessageType.icecomplete, this.onIceComplete)
        this.eventEmitter.addListener(ERTCPeerEvents.ontrack, this.onTrack)

        this.rtc.addEventListener('connectionstatechange', (ev) => {
            if (this.rtc) {
                console.log('onconnectionstatechange:', this.rtc.connectionState, this.user.socketId)
            } else {
                console.log('onconnectionstatechange:', ev)
            }
        })
        this.rtc.addEventListener('datachannel', ev => {
            if (this.rtc) {
                console.log('ondatachannel:', ev, this.user.socketId)
            } else {
                console.log('ondatachannel:', ev)
            }
        })
        this.rtc.addEventListener('icecandidate', ev => {
            if (this.rtc) {
                console.log('onicecandidate:', ev.candidate && ev.candidate.candidate, this.user.socketId)
            } else {
                console.log('onicecandidate:', ev)
            }            
        })
        this.rtc.addEventListener('icecandidateerror', ev => {
            if (this.rtc) {
                console.log('onicecandidateerror:', ev.errorText, this.user.socketId)
            } else {
                console.log('onicecandidateerror:', ev)                
            }            
        })
        this.rtc.addEventListener('iceconnectionstatechange', ev => {
            if (this.rtc) {
                console.log('oniceconnectionstatechange:', this.rtc.iceConnectionState, this.user.socketId)
            } else {
                console.log('oniceconnectionstatechange:', ev)                
            }            
        })
        this.rtc.addEventListener('icegatheringstatechange', ev => {
            if (this.rtc) {
                console.log('onicegatheringstatechange:', this.rtc.iceGatheringState, this.user.socketId)
            } else {
                console.log('onicegatheringstatechange:', ev)                
            }            
        })
        this.rtc.addEventListener('negotiationneeded', ev => {
            if (this.rtc) {
                console.log('onnegotiationneeded:')
            } else {
                console.log('onnegotiationneeded:')                
            }            
        })
        this.rtc.addEventListener('signalingstatechange', ev => {
            if (this.rtc) {
                console.log('onsignalingstatechange:', this.rtc.signalingState, this.user.socketId, this.user.socketId)
            } else {
                console.log('onsignalingstatechange:', ev)                
            }            
        })
        this.rtc.addEventListener('statsended', ev => {
            if (this.rtc) {
                console.log('onstatsended:', this.user.socketId)
            } else {
                console.log('onstatsended:', ev)                
            }            
        })
        this.rtc.addEventListener('track', ev => {            
            if (this.rtc) {
                console.warn('ontrack:', this.user.socketId, this.user.socketId);
                console.dir(this)
            } else {
                console.warn('ontrack:', ev);                
            }
        })        
    }
    unInitEvents() {
        Object.keys(this._rtcevents).forEach(key => {
            let value = this._rtcevents[key];
            this.rtc.removeEventListener(key, value)
        })
        this.eventEmitter.removeListener(ESignalerMessageType.offer, this.onOffer)
        this.eventEmitter.removeListener(ESignalerMessageType.answer, this.onAnswer)
        this.eventEmitter.removeListener(ESignalerMessageType.candidate, this.onCandidate)
        this.eventEmitter.removeListener(ESignalerMessageType.icecomplete, this.onIceComplete)    
            
    }


    doICE(stream: MediaStream) {
        this.addStream(stream)
        this.createOffer();        
    }
    addStream(stream: MediaStream) {    
        if (stream) {
            let idx = this.sendStreams.indexOf(stream);
            if (idx < 0) {
                this.sendStreams.push(stream);
                let onInactive = (ev) => {
                    stream.removeEventListener('inactive', onInactive);
                    this.notDestroyed && this.onSendStreamsInactive(stream);
                }
                stream.addEventListener('inactive', onInactive);

                stream.getTracks().forEach(track => {
                    console.log('add track', this.user.socketId)
                    console.dir(this)
                    this.rtc.addTrack(track)
                })                        
            }
        }    
    }

    createOffer(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.rtc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            }).then((sdp) => {
                this.rtc.setLocalDescription(sdp)
                .then(() => {
                    this.sendOffer(sdp);
                    resolve();
                })           
                .catch((err) => {
                    console.error(err)
                    reject(err)
                })             
            }).catch((err) => {
                console.error(err)
                reject(err)
            })
        })
    }    
    sendOffer(sdp?: RTCSessionDescriptionInit) {
        sdp = sdp || this.rtc.localDescription.toJSON();
        let msg: ISignalerMessage = {
            type: ESignalerMessageType.offer,
            data: sdp
        }
        this.user.sendMessage(msg)
    }

    createAnswer(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.rtc.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            }).then((sdp) => {
                this.rtc.setLocalDescription(sdp)
                .then(() => {
                    this.sendAnswer(sdp);
                    resolve();
                })           
                .catch((err) => {
                    console.error(err)
                    reject(err)
                })             
            }).catch((err) => {
                console.error(err)
                reject(err)
            })
        })
    }    
    sendAnswer(sdp?: RTCSessionDescriptionInit) {
        sdp = sdp || this.rtc.localDescription.toJSON();
        let msg: ISignalerMessage = {
            type: ESignalerMessageType.answer,
            data: sdp
        }
        this.user.sendMessage(msg)
    }

    onIceCandidate = (ev: RTCPeerConnectionIceEvent) => {
        if (ev.candidate) {
            let msg: ISignalerMessage = {
                type: ESignalerMessageType.candidate,
                data: ev.candidate.toJSON()
            }            
            this.user.sendMessage(msg)
        } else {
            let msg: ISignalerMessage = {
                type: ESignalerMessageType.icecomplete,
            }
            this.user.sendMessage(msg)
        }
    }

    stopSharing(): Promise<any> {
        if (this.sendStreams.length > 0) {
            let promises = [];
            this.sendStreams.forEach(stream => {
                let promise = new Promise((resolve, reject) => {
                    let onInactive = () => {
                        resolve();
                    }             
                    stream.addEventListener('inactive', onInactive);
                    stream.getTracks().forEach(track => {
                        track.stop();
                    })
                })
                promises.push(promise);
            })            
            return Promise.all(promises);

        } else {
            return Promise.resolve();
        }
    }

    //网络事件
    onOffer = (data: any) => {
        console.log('on offer')
        this.rtc.setRemoteDescription(data)
        .then(() => {
            this.createAnswer()
            .catch((err => {
                console.error(err)
            }))         
        })
        .catch(err => {
            console.error(err)
        })
    }   
    onAnswer = (data: any) => {
        console.log('on answer')
        this.rtc.setRemoteDescription(data)
        .catch(err => {
            console.error(err)
        })
    }     
    onCandidate = (data: any) => {
        console.log(this.user.socketId, 'add candidate', data)
        this.rtc.addIceCandidate(data)
    }
    onIceComplete = () => {
        // console.log()
    }    
    onTrack = (ev: RTCTrackEvent) => {
        this.recvStreams = ev.streams;
        this.recvStreams.forEach(stream => {
            let onInactive = (ev) => {
                stream.removeEventListener('inactive', onInactive);
                this.onRecvStreamsInactive(stream);
            }
            stream.addEventListener('inactive', onInactive);
        })
    }
    onRecvStreamsInactive = (stream: MediaStream) => {
        if (this.notDestroyed) {
            this.eventEmitter.emit(ERTCPeerEvents.onrecvstreaminactive, stream, this)
        }
    }
    onSendStreamsInactive = (stream: MediaStream) => {
        if (this.notDestroyed) {
            let idx = this.sendStreams.indexOf(stream);
            if (idx >= 0) {
                this.sendStreams.splice(idx, 1)
            }        
            this.eventEmitter.emit(ERTCPeerEvents.onrecvstreaminactive, stream, this)        
        }
    }    
}