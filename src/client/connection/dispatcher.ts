import { Base, IBase } from "./base";
import { Signaler } from "./signaler";
import { Rooms } from "./rooms";
import { ECustomEvents, IUserQuery } from "./client";

export interface IDispatcher extends IBase {

}

export class Dispatcher extends Base {
    signaler: Signaler
    rooms: Rooms
    constructor(signaler: Signaler, rooms: Rooms) {
        super();
        this.signaler = signaler;
        this.rooms = rooms;
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        delete this.signaler;
        delete this.rooms;
        super.destroy();
    }

    initEvents() {
        this.signaler.eventEmitter.addListener(ECustomEvents.joinRoom, this.onJoinRoom)
        this.signaler.eventEmitter.addListener(ECustomEvents.leaveRoom, this.onLeaveRoom)
        this.signaler.eventEmitter.addListener(ECustomEvents.closeRoom, this.onCloseRoom)
        this.signaler.eventEmitter.addListener(ECustomEvents.message, this.onMessage)
    }
    unInitEvents = () => {
        this.signaler.eventEmitter.removeListener(ECustomEvents.joinRoom, this.onJoinRoom)
        this.signaler.eventEmitter.removeListener(ECustomEvents.leaveRoom, this.onLeaveRoom)
        this.signaler.eventEmitter.removeListener(ECustomEvents.closeRoom, this.onCloseRoom)
        this.signaler.eventEmitter.removeListener(ECustomEvents.message, this.onMessage)
    }

    onJoinRoom = (query: IUserQuery) => {
        let room = this.rooms.getRoom(query.roomid);
        room && room.eventEmitter.emit(ECustomEvents.joinRoom, query);
    }
    onLeaveRoom = (query: IUserQuery) => {
        let room = this.rooms.getRoom(query.roomid);
        room && room.eventEmitter.emit(ECustomEvents.leaveRoom, query);
    }    
    onCloseRoom = (query: IUserQuery) => {
        let room = this.rooms.getRoom(query.roomid);
        room && room.eventEmitter.emit(ECustomEvents.closeRoom, query);
        this.rooms.eventEmitter.emit(ECustomEvents.closeRoom, query);
    }  
    onMessage = (query: IUserQuery) => {
        let room = this.rooms.getRoom(query.roomid);
        room && room.eventEmitter.emit(ECustomEvents.message, query);        
    }
}