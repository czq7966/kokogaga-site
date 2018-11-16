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
}

export class Peer extends Base {
    user: IUser
    rtc: RTCPeerConnection
    private _rtcevents;
    constructor(user: IUser) {
        super()
        this._rtcevents = {};
        this.user = user;
        this.rtc = new RTCPeerConnection(config);
        this.initEvents();
    }
    destroy() {                
        this.rtc.close();
        this.unInitEvents();
        delete this._rtcevents
        delete this.rtc;
        delete this.user;
        super.destroy();
    }
    initEvents() {
        // [ERTCPeerEvents].forEach(events => {
        //     Object.keys(ERTCPeerEvents).forEach(key => {
        //         let value = events[key];
        //         let event = (...args: any[]) => {
        //             console.log('PeerEvent:', value, ...args)
        //             this.eventEmitter.emit(value, ...args)
        //         }
        //         this._rtcevents[value] = event;
        //         this.rtc.addEventListener(value, event)
        //     })
        // })
        this.rtc.addEventListener(ERTCPeerEvents.onicecandidate, this.onIceCandidate)
        this.eventEmitter.addListener(ESignalerMessageType.offer, this.onOffer)
        this.eventEmitter.addListener(ESignalerMessageType.answer, this.onAnswer)
        this.eventEmitter.addListener(ESignalerMessageType.candidate, this.onCandidate)
        this.eventEmitter.addListener(ESignalerMessageType.icecomplete, this.onIceComplete)

        this.rtc.addEventListener('connectionstatechange', (ev) => {
            console.log('onconnectionstatechange:', this.rtc.connectionState)
        })
        this.rtc.addEventListener('datachannel', ev => {
            console.log('ondatachannel:', ev)
        })
        this.rtc.addEventListener('icecandidate', ev => {
            console.log('onicecandidate:', ev.candidate && ev.candidate.candidate)
        })
        this.rtc.addEventListener('icecandidateerror', ev => {
            console.log('onicecandidateerror:', ev.errorText)
        })
        this.rtc.addEventListener('iceconnectionstatechange', ev => {
            console.log('oniceconnectionstatechange:', this.rtc.iceConnectionState)
        })
        this.rtc.addEventListener('icegatheringstatechange', ev => {
            console.log('onicegatheringstatechange:', this.rtc.iceGatheringState)
        })
        this.rtc.addEventListener('negotiationneeded', ev => {
            console.log('onnegotiationneeded:')
        })
        this.rtc.addEventListener('signalingstatechange', ev => {
            console.log('onsignalingstatechange:', this.rtc.signalingState)
        })
        this.rtc.addEventListener('statsended', ev => {
            console.log('onstatsended:')
        })
        this.rtc.addEventListener('track', ev => {
            console.log('ontrack:')
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
    sendMessage(msg: any) {
        let query: IUserQuery = {
            roomid: this.user.room.roomid,
            to: this.user.userId,
            msg: msg
        }
        this.user.signaler.sendMessage(query)
    }

    doICE(stream: MediaStream) {
        this.addStream(stream)
        this.createOffer();        
    }
    addStream(stream: MediaStream) {
        stream &&
        stream.getTracks().forEach(track => {
            this.rtc.addTrack(track)
        })        
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
        this.sendMessage(msg)
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
        this.sendMessage(msg)
    }

    onIceCandidate = (ev: RTCPeerConnectionIceEvent) => {
        if (ev.candidate) {
            let msg: ISignalerMessage = {
                type: ESignalerMessageType.candidate,
                data: ev.candidate.toJSON()
            }
            this.sendMessage(msg)
        } else {
            let msg: ISignalerMessage = {
                type: ESignalerMessageType.icecomplete,
            }
            this.sendMessage(msg)
        }
    }

    //网络事件
    onOffer = (data: any) => {
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
        this.rtc.setRemoteDescription(data)
        .catch(err => {
            console.error(err)
        })
    }     
    onCandidate = (data: any) => {
        this.rtc.addIceCandidate(data)
    }
    onIceComplete = () => {
        // console.log()
    }    
}