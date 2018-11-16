import { Signaler, ISignalerMessage, ESignalerMessageType } from "./signaler";
import { Peer } from "./peer";
import { IBase, Base } from "./bast";
import { Room } from "./room";
import { IUserQuery, ECustomEvents } from "./client";

export interface IUserParams {
    userId: string,
    isOwner: boolean,
    isReady?: boolean;
    signaler?: Signaler;
    peer?: Peer;
    room?: Room;
}

export interface IUser extends IBase , IUserParams {
    initEvents()
    unInitEvents()
    onMessage(query: IUserQuery)
    onReady(query: IUserQuery)
    imReady()
    sayHello(to?: string)
}

export class User extends Base implements IUser {
    userId: string;    
    isOwner: boolean;
    isReady: boolean;
    signaler: Signaler;
    peer: Peer;
    room: Room;
    stream: MediaStream;
    constructor(user: IUserParams) {
        super();
        this.userId = user.userId;
        this.isOwner = user.isOwner;
        this.isReady = user.isReady;
        this.signaler = user.signaler;
        this.peer = new Peer(this);
        this.room = user.room;
        this.initEvents();
    }
    destroy() {        
        this.unInitEvents();
        this.peer.destroy();
        delete this.peer;
        super.destroy();
    }
    initEvents() {
        this.eventEmitter.addListener(ECustomEvents.message, this.onMessage)        
    }
    unInitEvents() {
        this.eventEmitter.removeListener(ECustomEvents.message, this.onMessage)        
    }
    onMessage = (query: IUserQuery) => {
        if (query.from == this.userId) {
            let msg = query.msg as ISignalerMessage;
            switch (msg.type) {
                case ESignalerMessageType.offer :
                    this.peer.eventEmitter.emit(ESignalerMessageType.offer, msg.data)
                    break;
                case ESignalerMessageType.answer:
                    this.peer.eventEmitter.emit(ESignalerMessageType.answer, msg.data)
                    break;
                case ESignalerMessageType.candidate:
                    this.peer.eventEmitter.emit(ESignalerMessageType.candidate, msg.data)
                    break;
                case ESignalerMessageType.ready:
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

    imReady() {
        let msg: ISignalerMessage = {
            type: ESignalerMessageType.ready
        }
        let query: IUserQuery = {
            roomid: this.room.roomid,
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
            from: this.userId,
            to: to,
            msg: msg                
        }
        this.signaler.sendMessage(query);
    }   
    addStream(stream: MediaStream) {
        this.stream = stream;   
        this.doICE();     
    } 
    doICE() {
        if (this.isReady) {
            this.peer.doICE(this.stream);

        }
    }
}