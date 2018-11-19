import { Signaler } from "./signaler";
import { Rooms } from "./rooms";
import { Base } from "./bast";
import { User } from "./user";
import { IUserQuery } from "./client";
import { Dispatcher } from "./dispatcher";


export class Connection extends Base {
    signaler: Signaler;
    rooms: Rooms;
    dispatcher: Dispatcher
    signalerUrl: string;
    stream: MediaStream;
    constructor(url: string) {
        super()
        this.signaler = new Signaler(url);
        this.rooms = new Rooms(this.signaler);
        this.dispatcher = new Dispatcher(this.signaler, this.rooms);
    }    
    destroy() {
        this.signaler.destroy();
        this.rooms.destroy();
        delete this.signaler;
        delete this.rooms;
        super.destroy();
    }
    get id(): string {
        return this.signaler && this.signaler.id;
    }

    openRoom(query: IUserQuery): Promise<any> {
        let promise =  this.signaler.openRoom(query);
        promise.then((result) => {
            query = result;
            let room = this.rooms.newRoom(query.roomid, query.password);
            let user = new User({ 
                socketId: this.signaler.id,
                isOwner: true,
                signaler: this.signaler
            });
            room.addUser(user);
        })
        return promise;
    }

    joinRoom(query: IUserQuery): Promise<any> {
        let promise =  this.signaler.joinRoom(query);
        promise.then(() => {
            let room = this.rooms.newRoom(query.roomid, query.password);
            let user = new User({ 
                socketId: this.signaler.id,
                isOwner: false
            });
            room.addUser(user);
            user.imReady();
        })
        return promise;        
    }         
    leaveRoom(query: IUserQuery): Promise<any> {
        let promise =  this.signaler.leaveRoom(query);
        promise.then(() => {
            this.rooms.delRoom(query.roomid);
        })
        return promise;          
    }      
}