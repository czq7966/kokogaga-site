import { Base } from "./base";
import { Room } from "./room";
import { Signaler } from "./signaler";
import { ECustomEvents, IUserQuery } from "./client";

export enum ERoomsEvents {
    onnewroom = 'onnewroom'
}
export class Rooms extends Base {
    signaler: Signaler
    rooms: {[id: string]: Room}
    constructor(signaler: Signaler) {
        super();
        this.signaler = signaler;
        this.rooms = {}
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        Object.keys(this.rooms).forEach(key => {
            let room = this.rooms[key];
            room.destroy();
        })
        delete this.signaler;
        delete this.rooms;
        super.destroy();
    }

    initEvents() {
        this.eventEmitter.addListener(ECustomEvents.closeRoom, this.onCloseRoom)

    }
    unInitEvents() {
        this.eventEmitter.removeListener(ECustomEvents.closeRoom, this.onCloseRoom)
    }

    count() {
        return Object.keys(this.rooms).length
    }


    onCloseRoom = (query: IUserQuery) => {
        this.delRoom(query.roomid);
    }
    newRoom(roomid: string, password?: string): Room {
        if (roomid) {
            let room = new Room({roomid: roomid, password: password});
            room.signaler = this.signaler;
            this.rooms[roomid] = room;
            this.eventEmitter.emit(ERoomsEvents.onnewroom, room)
            return room;
        }
    }
    getRoom(roomid: string): Room {
        return this.rooms[roomid];
    }
    delRoom(roomid: string) {
        let room = this.rooms[roomid];
        room && room.destroy();
        delete this.rooms[roomid];
    }
    close() {
        Object.keys(this.rooms).forEach(key => {
            this.rooms[key].close();
        })       
    }
}