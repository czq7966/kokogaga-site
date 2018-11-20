import { IBase, Base } from "./bast";
import { IUser, User } from "./user";
import { Signaler, ISignalerMessage, ESignalerMessageType } from "./signaler";
import { ECustomEvents, IUserQuery } from "./client";
import { ERTCPeerEvents } from "./peer";

export interface IRoomParams {
    roomid: string
    password: string
    max?: number
    Signaler?: Signaler
}
export interface IRoom extends IBase, IRoomParams {
    users: {[id: string]: IUser}
    getOwner():IUser
    isOwner(socketId: string): boolean
    addUser(user: IUser): IUser
    delUser(socketId: string)
    currUser(): IUser
}

export class Room extends Base implements IRoom {
    roomid: string
    password: string
    max: number
    signaler: Signaler
    users: {[id: string]: IUser}
    constructor(room: IRoomParams) {
        super();
        this.roomid = room.roomid;
        this.password = room.password;
        this.max = room.max;
        this.signaler = room.Signaler;
        this.users = {}
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();   
        this.clearUsers(); 
        delete this.users;
        super.destroy();
    }
    initEvents() {
        this.eventEmitter.addListener(ECustomEvents.joinRoom, this.onJoinRoom);
        this.eventEmitter.addListener(ECustomEvents.leaveRoom, this.onLeaveRoom);
        this.eventEmitter.addListener(ECustomEvents.closeRoom, this.onCloseRoom);
        this.eventEmitter.addListener(ECustomEvents.message, this.onMessage);
    }
    unInitEvents() {
        this.eventEmitter.removeListener(ECustomEvents.joinRoom, this.onJoinRoom)
        this.eventEmitter.removeListener(ECustomEvents.leaveRoom, this.onLeaveRoom);
        this.eventEmitter.removeListener(ECustomEvents.closeRoom, this.onCloseRoom);
        this.eventEmitter.removeListener(ECustomEvents.message, this.onMessage)
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
    onTrack = (ev: RTCTrackEvent, user: IUser) => {
        this.eventEmitter.emit(ERTCPeerEvents.ontrack, ev, user);
    }
    onRecvStreamInactive = (stream: MediaStream, user: IUser) => {
        this.eventEmitter.emit(ERTCPeerEvents.onrecvstreaminactive, stream, user);
    }
    onSendStreamInactive = (stream: MediaStream, user: IUser) => {
        this.eventEmitter.emit(ERTCPeerEvents.onsendstreaminactive, stream, user);
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
            user.eventEmitter.addListener(ERTCPeerEvents.ontrack, this.onTrack);
            user.eventEmitter.addListener(ERTCPeerEvents.onrecvstreaminactive, this.onRecvStreamInactive);
            user.eventEmitter.addListener(ERTCPeerEvents.onsendstreaminactive, this.onSendStreamInactive);
            this.users[user.socketId] = user;

            return this.users[user.socketId]
        }
    }
    delUser(socketId: string) {
        let user = this.users[socketId];
        if (user) {
            user.eventEmitter.removeListener(ERTCPeerEvents.ontrack, this.onTrack);
            user.eventEmitter.removeListener(ERTCPeerEvents.onrecvstreaminactive, this.onRecvStreamInactive);
            user.eventEmitter.removeListener(ERTCPeerEvents.onsendstreaminactive, this.onSendStreamInactive);
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
    currUser(): IUser {
        return this.getUser(this.signaler.id);
    }
}