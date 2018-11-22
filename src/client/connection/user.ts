import { Signaler, ISignalerMessage, ESignalerMessageType } from "./signaler";
import { Peer, ERTCPeerEvents } from "./peer";
import { IBase, Base } from "./base";
import { Room } from "./room";
import { IUserQuery, ECustomEvents } from "./client";

export interface IUserParams {
    socketId: string,
    isOwner: boolean,
    isReady?: boolean;
    signaler?: Signaler;
    peer?: Peer;
    room?: Room;
    stream?: MediaStream;
    video?: HTMLVideoElement;
}

export interface IUser extends IBase , IUserParams {
    initEvents()
    unInitEvents()
    onMessage(query: IUserQuery)
    onReady(query: IUserQuery)
    onTrack(ev: RTCTrackEvent) 
    onRecvStreamInactive(stream: MediaStream)
    onSendStreamInactive(stream: MediaStream) 
    stopSharing(): Promise<any>
    imReady()
    sayHello(to?: string)
    addStream(stream: MediaStream)
    doICE()
    sendMessage(msg: any)
}

export class User extends Base implements IUser {
    socketId: string;    
    isOwner: boolean;
    isReady: boolean;
    signaler: Signaler;
    peer: Peer;
    room: Room;
    stream: MediaStream;
    constructor(user: IUserParams) {
        super();
        this.socketId = user.socketId;
        this.isOwner = user.isOwner;
        this.isReady = user.isReady;
        this.signaler = user.signaler;
        this.peer = new Peer(this);
        this.room = user.room;
        this.stream = user.stream;
        this.initEvents();
    }
    destroy() {        
        this.unInitEvents();
        this.peer.destroy();
        delete this.stream;
        delete this.peer;
        super.destroy();
    }
    initEvents() {
        this.eventEmitter.addListener(ECustomEvents.message, this.onMessage);    
        this.peer.eventEmitter.addListener(ERTCPeerEvents.ontrack, this.onTrack);
        this.peer.eventEmitter.addListener(ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange);
        
        this.peer.eventEmitter.addListener(ERTCPeerEvents.onrecvstreaminactive, this.onRecvStreamInactive);
        this.peer.eventEmitter.addListener(ERTCPeerEvents.onsendstreaminactive, this.onSendStreamInactive);
    }
    unInitEvents() {
        this.eventEmitter.removeListener(ECustomEvents.message, this.onMessage); 
        this.peer.eventEmitter.removeListener(ERTCPeerEvents.ontrack, this.onTrack);      
        this.peer.eventEmitter.removeListener(ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange);
        this.peer.eventEmitter.removeListener(ERTCPeerEvents.onrecvstreaminactive, this.onRecvStreamInactive);
        this.peer.eventEmitter.removeListener(ERTCPeerEvents.onsendstreaminactive, this.onSendStreamInactive);        
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
        let currUser = this.room.currUser();
        this.isReady = true;
        currUser.isOwner && this.doICE();
    }
    onTrack = (ev: RTCTrackEvent) => {
        this.eventEmitter.emit(ERTCPeerEvents.ontrack, ev, this);
    }
    onIceConnectionStateChange = (ev: Event) => {
        this.eventEmitter.emit(ERTCPeerEvents.oniceconnectionstatechange, ev, this);
    }
    onRecvStreamInactive = (stream: MediaStream) => {
        this.eventEmitter.emit(ERTCPeerEvents.onrecvstreaminactive, stream, this);
    }
    onSendStreamInactive = (stream: MediaStream) => {
        this.eventEmitter.emit(ERTCPeerEvents.onsendstreaminactive, stream, this);
        if (stream === this.stream) {
            delete this.stream;
        }        
    }    
    stopSharing(): Promise<any> {
        return this.peer.stopSharing();
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
    addStream(stream: MediaStream) {
        this.stream = stream; 
        this.peer.addStream(stream);
        this.doICE();     
    } 
    doICE() {
        let stream = this.room.currUser().stream;
        if (stream && this.isReady) {
            this.peer.doICE(stream);
        }
    }
}