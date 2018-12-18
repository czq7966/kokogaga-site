import { Signaler, ISignalerMessage, ESignalerMessageType } from "./signaler";
import { Peer, ERTCPeerEvents } from "./peer";
import { IBase, Base } from "./base";
import { Room } from "./room";
import { IUserQuery, ECustomEvents } from "./client";
import { Streams } from "./streams";

export interface IUserParams {
    socketId: string,
    isOwner: boolean,
    isReady?: boolean;
    signaler?: Signaler;
    peer?: Peer;
    room?: Room;
    // stream?: MediaStream;
    streams?: Streams;
    video?: HTMLVideoElement;
}

export interface IUser extends IBase , IUserParams {
    initEvents()
    unInitEvents()
    onMessage(query: IUserQuery)
    onReady(query: IUserQuery)
    stopSharing(): Promise<any>
    imReady()
    sayHello(to?: string)
    addSendStream(stream: MediaStream)
    addSendStreams(streams: Array<MediaStream>)
    doICE()
    sendMessage(msg: any)
    close()
}

export class User extends Base implements IUser {
    socketId: string;    
    isOwner: boolean;
    isReady: boolean;
    signaler: Signaler;
    peer: Peer;
    room: Room;
    // stream: MediaStream;
    streams: Streams;
    constructor(user: IUserParams) {
        super();
        this.streams = new Streams(this);
        this.socketId = user.socketId;
        this.isOwner = user.isOwner;
        this.isReady = user.isReady;
        this.signaler = user.signaler;
        this.peer = new Peer(this);
        this.room = user.room;
        // this.stream = user.stream;
        this.initEvents();
    }
    destroy() {        
        this.unInitEvents();
        this.peer.destroy();
        this.streams.destroy();
        // delete this.stream;
        delete this.peer;
        super.destroy();
    }
    close() {

        this.peer.close();
    }    
    initEvents() {
        this.eventEmitter.addListener(ECustomEvents.message, this.onMessage);    

        this.peer.eventEmitter.addListener(ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange);
        this.peer.eventEmitter.addListener(ERTCPeerEvents.onrecvstream, this.onRecvStream);



    }
    unInitEvents() {
        this.eventEmitter.removeListener(ECustomEvents.message, this.onMessage); 

        this.peer.eventEmitter.removeListener(ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange);
        this.peer.eventEmitter.removeListener(ERTCPeerEvents.onrecvstream, this.onRecvStream);
    }
    onMessage = (query: IUserQuery) => {
        if (query.from == this.socketId) {
            let msg = query.msg as ISignalerMessage;
            switch (msg.type) {
                case ESignalerMessageType.offer :
                    console.log('on offer:', this.socketId)
                    this.peer.eventEmitter.emit(ESignalerMessageType.offer, msg.data)
                    break;
                case ESignalerMessageType.answer:
                    console.log('on answer:', this.socketId)
                    this.peer.eventEmitter.emit(ESignalerMessageType.answer, msg.data)
                    break;
                case ESignalerMessageType.candidate:
                    console.log('on candidate:', this.socketId)
                    this.peer.eventEmitter.emit(ESignalerMessageType.candidate, msg.data)
                    break;
                case ESignalerMessageType.ready:
                    console.log('on ready:', this.socketId)
                    this.onReady(query)
                    break;
                default:
                    break;
            }
        }
    }

    onReady(query: IUserQuery) {
        // let currUser = this.room.currUser();
        this.isReady = true;
        this.room.sendStreamsToUser(this);
        // this.addSendStream(this.room.currUser().stream);
        // currUser.isOwner && this.addStream(this.room.currUser().stream);
    }
    // onTrack = (ev: RTCTrackEvent) => {
    //     this.eventEmitter.emit(ERTCPeerEvents.ontrack, ev, this);
    // }
    onIceConnectionStateChange = (ev: Event) => {
        this.room.eventEmitter.emit(ERTCPeerEvents.oniceconnectionstatechange, ev, this, this.room);
    }
    onRecvStream = (stream: MediaStream) => {
        this.streams.addRecvStream(stream);
        this.room.eventEmitter.emit(ERTCPeerEvents.onrecvstream, stream, this, this.room);
    }

    stopSharing(): Promise<any> {
        return this.streams.stopSendStreams();
        // return new Promise((resolve, reject) => {
        //     if (this.stream) {
        //         let stream = this.stream;
        //         let onInactive = (ev) => {
        //             stream.removeEventListener('inactive', onInactive);
        //             resolve()
        //         }
        //         stream.addEventListener('inactive', onInactive);  
        //         stream.getTracks().forEach(track => {
        //             track.stop();
        //         })                   
        //     } else {
        //         resolve()
        //     }
        // })
    }

    imReady() {
        let msg: ISignalerMessage = {
            type: ESignalerMessageType.ready
        }
        let query: IUserQuery = {
            roomid: this.room.roomid,
            from: this.socketId,
            isOwner: this.isOwner,
            msg: msg
        }
        this.signaler.sendMessage(query)
    }
    sayHello(to?: string) {
        let msg: ISignalerMessage = {
            type: ESignalerMessageType.hello    
        }
        let query: IUserQuery = {
            roomid: this.room.roomid,
            isOwner: this.isOwner,
            from: this.socketId,
            to: to,
            msg: msg                
        }
        this.signaler.sendMessage(query);
    }   
    sendMessage(msg: any) {
        let query: IUserQuery = {
            roomid: this.room.roomid,
            to:  this.socketId,
            msg: msg
        }
        this.signaler.sendMessage(query)
    }    
    addSendStream(stream: MediaStream) {
        if (stream && !this.streams.getSendStream(stream.id)) {
            this.streams.addSendStream(stream);
            this.doICE();
        }
        // if (stream) {
        //     if (!this.stream || this.stream.id != stream.id) {
        //         this.stream = stream; 
        //         let onInactive = (ev) => {
        //             stream.removeEventListener('inactive', onInactive);
        //             this.onSendStreamInactive(stream);
        //         }
        //         stream.addEventListener('inactive', onInactive);          
        //         this.doICE();     
        //     }
        // }
    } 
    addSendStreams(streams: Array<MediaStream>) {
        streams.forEach(stream => {
            this.addSendStream(stream);
        })
        
        // if (stream) {
        //     if (!this.stream || this.stream.id != stream.id) {
        //         this.stream = stream; 
        //         let onInactive = (ev) => {
        //             stream.removeEventListener('inactive', onInactive);
        //             this.onSendStreamInactive(stream);
        //         }
        //         stream.addEventListener('inactive', onInactive);          
        //         this.doICE();     
        //     }
        // }
    }     
    doICE() {
        if (this.isReady) {
            this.streams.getSendStreams().forEach(stream => {
                this.peer.doICE(stream);
            })
        }
        // if (this.stream && this.isReady) {
        //     this.peer.doICE(this.stream);
        // }
    }
    isCurrUser(): boolean {
        return this.socketId === this.signaler.id();
    }
}