import { ESignalerMessageType, ISignalerMessage } from "./signaler";
import { Base } from "./base";
import { IUser } from "./user";
import { sdpHelper } from "./helper/sdp";
import { Config, ECodecs } from "./config";
import { Streams } from "./streams";

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
    onrecvstream = 'onrecvstream',
    onrecvstreaminactive = 'onrecvstreaminactive',
    onsendstreaminactive = 'onsendstreaminactive',
}
export enum EPeerEvents {
    ongetconfig = 'ongetconfig'    
}

export class Peer extends Base {
    config: Config;
    user: IUser
    streams: Streams;
    private _rtcevents;
    private _rtc: RTCPeerConnection    
    constructor(user: IUser) {
        super()
        this.config = new Config();
        this.streams = new Streams(this);
        this._rtcevents = {};
        this.user = user;        
        this.initEvents();
    }
    destroy() {      
        this._rtc && this._rtc.close();
        this.unInitEvents();
        this.streams.destroy();        
        delete this._rtcevents
        delete this._rtc;
        delete this.user;
        delete this.config;
        delete this.streams;
        super.destroy();
    }
    close() {
        this._rtc && this._rtc.close();
    }    
    initEvents() {        
        // 信令事件
        this.eventEmitter.addListener(ESignalerMessageType.offer, this.onOffer)
        this.eventEmitter.addListener(ESignalerMessageType.answer, this.onAnswer)
        this.eventEmitter.addListener(ESignalerMessageType.candidate, this.onCandidate)
        this.eventEmitter.addListener(ESignalerMessageType.icecomplete, this.onIceComplete)

        this.eventEmitter.addListener(ERTCPeerEvents.ontrack, this.onTrack)
        this.eventEmitter.addListener(ERTCPeerEvents.onstream, this.onStream)        
        this.eventEmitter.addListener(ERTCPeerEvents.onicecandidate, this.onIceCandidate)   
        
        //流状态事件
        this.streams.eventEmitter.addListener(ERTCPeerEvents.onrecvstream, this.onRecvStream)
        
        //Log监视RTC状态变化
        this.eventEmitter.addListener(ERTCPeerEvents.onconnectionstatechange, (ev) => {
            this._rtc && 
            console.log('on'+ERTCPeerEvents.onconnectionstatechange+':', this.rtc().connectionState, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.ondatachannel, ev => {
            this._rtc && 
            console.log('on'+ERTCPeerEvents.ondatachannel+':', ev, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.onicecandidate, ev => {
            this._rtc && 
            console.log('on'+ERTCPeerEvents.onicecandidate+':', ev.candidate && ev.candidate.candidate, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.onicecandidateerror, ev => {
            this._rtc && 
            console.log('on'+ERTCPeerEvents.onicecandidateerror+':', ev.errorText, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.oniceconnectionstatechange, ev => {
            this._rtc && 
            console.log('on'+ERTCPeerEvents.oniceconnectionstatechange+':', this.rtc().iceConnectionState, this.user.socketId)
        })
        this.eventEmitter.addListener(ERTCPeerEvents.onicegatheringstatechange, ev => {
            this._rtc && 
            console.log('on'+ERTCPeerEvents.onicegatheringstatechange+':', this.rtc().iceGatheringState, this.user.socketId)
        })    
        this.eventEmitter.addListener(ERTCPeerEvents.onnegotiationneeded, ev => {
            this._rtc && 
            console.log('on'+ERTCPeerEvents.onnegotiationneeded+':')
        })   
        this.eventEmitter.addListener(ERTCPeerEvents.onsignalingstatechange, ev => {
            this._rtc && 
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
        
        //流状态事件
        this.streams.eventEmitter.removeListener(ERTCPeerEvents.onrecvstream, this.onRecvStream)
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
            this._rtc = new RTCPeerConnection(this.getConfig().rtcConfig);
            this.initRTCEvents(this._rtc);
        }
        return this._rtc
    }


    doICE(stream: MediaStream) {
        if (this.addSendStream(stream)) {
            this.createOffer();        
        }
    }
    addSendStream(stream: MediaStream): boolean {    
        if (stream && !this.streams.getSendStream(stream.id)) {
            this.streams.addSendStream(stream);
            (this.rtc() as any).addStream(stream)
            return true;
        }
        return false;
    }

    getConfig(): Config {
        this.eventEmitter.emit(EPeerEvents.ongetconfig, this.config);
        return this.config;
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
                let codec = this.config.codec || ECodecs.default;
                let bandwidth = this.config.bandwidth || 0;
                if (codec !== ECodecs.default) {
                    sdp.sdp = sdpHelper.preferCodec(sdp.sdp, codec);
                }
                if (bandwidth > 0) {                     
                    sdp.sdp = sdpHelper.setVideoBitrates(sdp.sdp, {start: bandwidth, min:bandwidth, max: bandwidth})
                }
                // sdp.sdp = sdpHelper.disableNACK(sdp.sdp);
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
        return this.streams.stopSendStreams();
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
            this.streams.addRecvStream(stream)
        })
    }
    onStream = (ev: any) => {
        let stream = ev.stream as MediaStream;
        this.streams.addRecvStream(stream);
    }
    onRecvStream = (stream: MediaStream) => {
        this.eventEmitter.emit(ERTCPeerEvents.onrecvstream, stream, this);
    } 
}