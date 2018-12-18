import { IBase, Base } from "./base";
import { IUser, User } from "./user";
import { Signaler, ISignalerMessage, ESignalerMessageType } from "./signaler";
import { ECustomEvents, IUserQuery } from "./client";
import { ERTCPeerEvents } from "./peer";
import { Streams } from "./streams";

export enum ERoomEvents {
    onadduser = 'onadduser'
}
export interface IRoomParams {
    roomid: string
    password: string
    max?: number
    Signaler?: Signaler
}
export interface IRoom extends IBase, IRoomParams {
    users: {[id: string]: IUser}
    streams: Streams;    
    getOwner():IUser
    isOwner(socketId: string): boolean
    addUser(user: IUser): IUser
    delUser(socketId: string)
    currUser(): IUser
    addSendStream(stream: MediaStream, user?: IUser)
}

export class Room extends Base implements IRoom {
    roomid: string
    password: string
    max: number
    signaler: Signaler
    users: {[id: string]: IUser}
    streams: Streams;

    constructor(room: IRoomParams) {
        super();
        this.streams = new Streams(this);     
        this.roomid = room.roomid;
        this.password = room.password;
        this.max = room.max;
        this.signaler = room.Signaler;
        this.users = {}
        this.initEvents();
    }
    destroy() {                
        this.unInitEvents();   
        this.streams.destroy();
        this.clearUsers(); 
        delete this.users;
        delete this.streams;
        super.destroy();
    }
    initEvents() {
        this.eventEmitter.addListener(ECustomEvents.joinRoom, this.onJoinRoom);
        this.eventEmitter.addListener(ECustomEvents.leaveRoom, this.onLeaveRoom);
        this.eventEmitter.addListener(ECustomEvents.closeRoom, this.onCloseRoom);
        this.eventEmitter.addListener(ECustomEvents.message, this.onMessage);

        this.eventEmitter.addListener(ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange);
        this.eventEmitter.addListener(ERTCPeerEvents.onrecvstream, this.onRecvStream);        
    }
    unInitEvents() {
        this.eventEmitter.removeListener(ECustomEvents.joinRoom, this.onJoinRoom)
        this.eventEmitter.removeListener(ECustomEvents.leaveRoom, this.onLeaveRoom);
        this.eventEmitter.removeListener(ECustomEvents.closeRoom, this.onCloseRoom);
        this.eventEmitter.removeListener(ECustomEvents.message, this.onMessage)

        this.eventEmitter.removeListener(ERTCPeerEvents.oniceconnectionstatechange, this.onIceConnectionStateChange);
        this.eventEmitter.removeListener(ERTCPeerEvents.onrecvstream, this.onRecvStream);        
    }
    onJoinRoom = (query: IUserQuery) => {
        if (!this.users[query.from]) {
            let user = new User({
                socketId: query.from,
                isOwner: query.isOwner
            })
            this.addUser(user);
            this.currUser().sayHello(user.socketId);
        }
    }
    onLeaveRoom = (query: IUserQuery) => {
        this.delUser(query.from);
    }
    onCloseRoom = (query: IUserQuery) => {
        
    }
    onMessage = (query: IUserQuery) => {
        let msg = query.msg as ISignalerMessage;
        let user = this.getUser(query.from);
        switch(msg.type) {
            case ESignalerMessageType.hello:
                if (!user) {
                    user = new User({
                        socketId: query.from,
                        isOwner: query.isOwner
                    })
                    this.addUser(user); 
                }
                break;
            default:                
                break;
        }
        user && user.eventEmitter.emit(ECustomEvents.message, query);        
    }
    onRecvStream = (stream: MediaStream, user: IUser) => {
        this.streams.addRecvStream(stream);
    }
    onIceConnectionStateChange = (ev: RTCTrackEvent, user: IUser) => {
        // this.eventEmitter.emit(ERTCPeerEvents.oniceconnectionstatechange, ev, user);
    }    

    getOwner():IUser {
        let user: IUser
        Object.keys(this.users).some(key => {
            if (this.users[key].isOwner) {
                user = this.users[key];
                return true;
            }
        })
        return user;
    }
    isOwner(socketId: string): boolean {
        return this.users[socketId] && this.users[socketId].isOwner;        
    }
    addUser(user: IUser): IUser {
        if (user && user.socketId) {
            user.room = this;
            user.signaler = user.signaler || this.signaler;
            this.users[user.socketId] = user;
            this.eventEmitter.emit(ERoomEvents.onadduser, user)

            return this.users[user.socketId]
        }
    }
    delUser(socketId: string) {
        let user = this.users[socketId];
        if (user) {
            user.destroy();
        }
        delete this.users[socketId];
    }
    clearUsers() {
        Object.keys(this.users).forEach(key => {
            this.delUser(key)
        })
    }
    getUser(socketId: string) {
        return this.users[socketId];
    }
    getUsers(): Array<IUser> {
        let result = [];
        Object.keys(this.users).forEach(id => {
            result.push(this.users[id])
        })
        return result;
    }
    currUser(): IUser {
        return this.getUser(this.signaler.id());
    }
    addSendStream(stream: MediaStream, user?: IUser) {    
        if (stream) {
            if (!this.streams.getSendStream(stream.id)) {
                this.streams.addSendStream(stream);
            }
        }
        this.sendStreamsToUser();  
    }
    sendStreamsToUser(user?: IUser) {
        let streams = this.streams.getSendStreams();
        if (user) {
            user.addSendStreams(streams)
        } else {
            this.getUsers().forEach(user => {
                user.addSendStreams(streams)
            })            
        }
    }
    close() {
        Object.keys(this.users).forEach(key => {
            this.users[key].close();
        })      
    }    
}