import { ESignalerMessageType, ISignalerMessage } from "./signaler";
import { Base } from "./base";
import { IUser } from "./user";

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
    onstream = 'stream',
    onrecvstreaminactive = 'recvstreaminactive',
    onsendstreaminactive = 'sendstreaminactive'
}

export class Peer extends Base {
    user: IUser
    sendStreams: {[id: string]: MediaStream};
    recvStreams: {[id: string]: MediaStream};
    private _rtcevents;
    private _rtc: RTCPeerConnection    
    constructor(user: IUser) {
        super()
        this.sendStreams = {};
        this.recvStreams = {};
        this._rtcevents = {};
        this.user = user;        
        this.initEvents();
    }
    destroy() {      
        this._rtc && this._rtc.close();
        Object.keys(this.sendStreams).forEach(id => {delete this.sendStreams[id]});
        Object.keys(this.recvStreams).forEach(id => {delete this.recvStreams[id]});
        this.unInitEvents();        
        delete this._rtcevents
        delete this._rtc;
        delete this.user;
        delete this.sendStreams;
        delete this.recvStreams;
        super.destroy();
    }
    initEvents() {        
        this.eventEmitter.addListener(ESignalerMessageType.offer, this.onOffer)
        this.eventEmitter.addListener(ESignalerMessageType.answer, this.onAnswer)
        this.eventEmitter.addListener(ESignalerMessageType.candidate, this.onCandidate)
        this.eventEmitter.addListener(ESignalerMessageType.icecomplete, this.onIceComplete)

        this.eventEmitter.addListener(ERTCPeerEvents.ontrack, this.onTrack)
        this.eventEmitter.addListener(ERTCPeerEvents.onstream, this.onStream)        
        this.eventEmitter.addListener(ERTCPeerEvents.onicecandidate, this.onIceCandidate)    
        
        //Log监视RTC状态变化
        this.eventEmitter.addListener(ERTCPeerEvents.onconnectionstatechange, (ev) => {
            console.log('on'+ERTCPeerEvents.onconnectionstatechange+':', this.rtc().connectionState, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.ondatachannel, ev => {
            console.log('on'+ERTCPeerEvents.ondatachannel+':', ev, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.onicecandidate, ev => {
            console.log('on'+ERTCPeerEvents.onicecandidate+':', ev.candidate && ev.candidate.candidate, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.onicecandidateerror, ev => {
            console.log('on'+ERTCPeerEvents.onicecandidateerror+':', ev.errorText, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.oniceconnectionstatechange, ev => {
            console.log('on'+ERTCPeerEvents.oniceconnectionstatechange+':', this.rtc().iceConnectionState, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.onicegatheringstatechange, ev => {
            console.log('on'+ERTCPeerEvents.onicegatheringstatechange+':', this.rtc().iceGatheringState, this.user.socketId)
        })    
        this.eventEmitter.addListener(ERTCPeerEvents.onnegotiationneeded, ev => {
            console.log('on'+ERTCPeerEvents.onnegotiationneeded+':')
        })   
        this.eventEmitter.addListener(ERTCPeerEvents.onsignalingstatechange, ev => {
            console.log('on'+ERTCPeerEvents.onsignalingstatechange+':', this.rtc().signalingState, this.user.socketId, this.user.socketId)
        })  
        this.eventEmitter.addListener(ERTCPeerEvents.onstatsended, ev => {
            console.log('on'+ERTCPeerEvents.onstatsended+':', this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.ontrack, ev => {            
            console.warn('ontrack:', this.user.socketId);
        })  
    }
    unInitEvents() {
        this.unInitRTCEvents(this._rtc);
        this.eventEmitter.removeListener(ESignalerMessageType.offer, this.onOffer)
        this.eventEmitter.removeListener(ESignalerMessageType.answer, this.onAnswer)
        this.eventEmitter.removeListener(ESignalerMessageType.candidate, this.onCandidate)
        this.eventEmitter.removeListener(ESignalerMessageType.icecomplete, this.onIceComplete)                
    }
    initRTCEvents(rtc: RTCPeerConnection) {
        rtc &&
        [ERTCPeerEvents].forEach(events => {
            Object.keys(ERTCPeerEvents).forEach(key => {
                let value = events[key];
                let event = (...args: any[]) => {
                    // console.log('PeerEvent:', value, ...args)
                    this.eventEmitter.emit(value, ...args)
                }
                this._rtcevents[value] = event;
                rtc.addEventListener(value, event)
            })
        })      
    }
    unInitRTCEvents(rtc: RTCPeerConnection) {
        rtc &&
        Object.keys(this._rtcevents).forEach(key => {
            let value = this._rtcevents[key];
            this.rtc().removeEventListener(key, value)
        })
    }    
    rtc() {
        if (!this._rtc) {
            this._rtc = new RTCPeerConnection(config);
            this.initRTCEvents(this._rtc);
        }
        return this._rtc
    }


    doICE(stream: MediaStream) {
        this.addStream(stream)
        this.createOffer();        
    }
    addStream(stream: MediaStream) {    
        if (stream && !this.sendStreams[stream.id]) {
            let id = stream.id;
            this.sendStreams[id] = stream;
            let onInactive = (ev) => {
                stream.removeEventListener('inactive', onInactive);
                if (this.notDestroyed) {
                    this.onSendStreamsInactive(stream);
                    delete this.sendStreams[id];
                }                 
            }
            stream.addEventListener('inactive', onInactive);
            (this.rtc() as any).addStream(stream)
        }    
    }

    // createOffer2(): Promise<any> {        
    //     return new Promise((resolve, reject) => {
    //         let rtc = this.rtc as any;
    //         let getOffer = (sdp) => {
    //             rtc.setLocalDescription()

    //         }
    //         rtc.createOffer(())
    //         {
    //             offerToReceiveAudio: true,
    //             offerToReceiveVideo: true
    //         }).then((sdp) => {
    //             this.rtc().setLocalDescription(sdp)
    //             .then(() => {
    //                 this.sendOffer(sdp);
    //                 resolve();
    //             })           
    //             .catch((err) => {
    //                 console.error(err)
    //                 reject(err)
    //             })             
    //         }).catch((err) => {
    //             console.error(err)
    //             reject(err)
    //         })
    //     })
    // }
    createOffer(): Promise<any> {        
        return new Promise((resolve, reject) => {
            this.rtc().createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            }).then((sdp) => {
                this.rtc().setLocalDescription(sdp)
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
        sdp = sdp || this.rtc().localDescription.toJSON();
        let msg: ISignalerMessage = {
            type: ESignalerMessageType.offer,
            data: sdp
        }
        this.user.sendMessage(msg)
    }

    createAnswer_bak(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.rtc().createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            }).then((sdp) => {
                this.rtc().setLocalDescription(sdp)
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
    createAnswer(): Promise<any> {
        return new Promise((resolve, reject) => {
            let rtc = this.rtc() as any;
            let createAnswerSuccess = (sdp) => {
                console.log('createAnswerSuccess', sdp)
                let setLocalDescriptionSuccess = () => {
                    this.sendAnswer(sdp);
                    resolve();
                }
                let setLocalDescriptionFailed = (err) => {
                    console.log('createAnswerFailed', err)
                }
                rtc.setLocalDescription(sdp, setLocalDescriptionSuccess, setLocalDescriptionFailed)
            }
            let createAnswerFailed = (err) => {
                console.log('createAnswerFailed', err)
                reject(err)
            }
            rtc.createAnswer(createAnswerSuccess, createAnswerFailed);
        })
    }  

    sendAnswer(sdp?: RTCSessionDescriptionInit) {
        sdp = sdp || this.rtc().localDescription.toJSON();
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
        let promises = [];
        Object.keys(this.sendStreams).forEach(id => {
            let stream = this.sendStreams[id];
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
        if (promises.length > 0) {
            return Promise.all(promises);
        } else {
            return Promise.resolve();
        }
    }

    //网络事件
    onOffer_bak = (data: any) => {
        console.log('on offer')
        this.rtc().setRemoteDescription(data)
        .then(() => {
            this.createAnswer()
            .catch((err => {
                console.log('Error', err)
            }))         
        })
        .catch(err => {
            console.log('Error',err)
        })
    }   
    onOffer = (data: any) => {
        console.log('on offer')
        let rtc = this.rtc() as any;
        let setRemoteDescriptionSuccess = () => {
            console.log('setRemoteDescriptionSuccess');
            this.createAnswer()
        }
        let setRemoteDescriptionFailed = (err) => {
            console.log('setRemoteDescriptionFailed', err)

        }
        rtc.setRemoteDescription(data, setRemoteDescriptionSuccess, setRemoteDescriptionFailed)
    }   

    onAnswer = (data: any) => {
        console.log('on answer')
        this.rtc().setRemoteDescription(data)
        .catch(err => {
            console.error(err)
        })
    }     
    onCandidate = (data: any) => {
        console.log('add candidate', data, this.user.socketId)
        this.rtc().addIceCandidate(data)
        .catch(err => {
            console.log('add Ic eCandidate error:', err)
        })
    }
    onIceComplete = () => {
        // console.log()
    }    
    onTrack = (ev: RTCTrackEvent) => {
        let streams = ev.streams;
        streams.forEach(stream => {
            if (!this.recvStreams[stream.id]) {
                this.recvStreams[stream.id] = stream;
                let onInactive = (ev) => {
                    stream.removeEventListener('inactive', onInactive);
                    this.onRecvStreamsInactive(stream);
                }
                stream.addEventListener('inactive', onInactive);  
            }
        })
    }
    onStream = (ev: any) => {
        let stream = ev.stream as MediaStream;
        let onInactive = (ev) => {
            stream.removeEventListener('inactive', onInactive);
            this.onRecvStreamsInactive(stream);
        }
        stream.addEventListener('inactive', onInactive);
    }
    onRecvStreamsInactive = (stream: MediaStream) => {
        if (this.notDestroyed) {
            this.eventEmitter.emit(ERTCPeerEvents.onrecvstreaminactive, stream, this)
        }
    }
    onSendStreamsInactive = (stream: MediaStream) => {
        if (this.notDestroyed) {
            this.eventEmitter.emit(ERTCPeerEvents.onsendstreaminactive, stream, this)        
        }
    }    
}