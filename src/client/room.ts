import { IBase, Base } from "./bast";
import { IUser, User } from "./user";
import { Signaler, ISignalerMessage, ESignalerMessageType } from "./signaler";
import { ECustomEvents, IUserQuery } from "./client";

export interface IRoomParams {
    roomid: string
    password: string
    max?: number
    Signaler?: Signaler
}
export interface IRoom extends IBase, IRoomParams {
    users: {[id: string]: IUser}
    getOwner():IUser
    isOwner(userId: string): boolean
    addUser(user: IUser): IUser
    delUser(userId: string)
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
        Object.keys(this.users).forEach(key => {
            let user = this.users[key];
            user.destroy();
            delete this.users[key]
        })
        this.unInitEvents();    
        delete this.users;
        super.destroy();
    }
    initEvents() {
        this.eventEmitter.addListener(ECustomEvents.joinRoom, this.onJoinRoom);
        this.eventEmitter.addListener(ECustomEvents.message, this.onMessage);
    }
    unInitEvents() {
        this.eventEmitter.removeListener(ECustomEvents.joinRoom, this.onJoinRoom)
        this.eventEmitter.removeListener(ECustomEvents.message, this.onMessage)
    }
    onJoinRoom = (query: IUserQuery) => {
        if (!this.users[query.from]) {
            let user = new User({
                userId: query.from,
                isOwner: query.isOwner
            })
            this.addUser(user);
            this.currUser().sayHello(user.userId);
        }
    }
    onMessage = (query: IUserQuery) => {
        let msg = query.msg as ISignalerMessage;
        let user = this.getUser(query.from);
        switch(msg.type) {
            case ESignalerMessageType.hello:
                if (!user) {
                    user = new User({
                        userId: query.from,
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
    isOwner(userId: string): boolean {
        return this.users[userId] && this.users[userId].isOwner;        
    }
    addUser(user: IUser): IUser {
        if (user && user.userId) {
            user.room = this;
            user.signaler = user.signaler || this.signaler;
            this.users[user.userId] = user;
            return this.users[user.userId]
        }
    }
    delUser(userId: string) {
        let user = this.users[userId];
        if (user) {
            user.destroy();
        }
        delete this.users[userId];
    }
    getUser(userId: string) {
        return this.users[userId];
    }
    currUser(): IUser {
        return this.getUser(this.signaler.id);
    }
}