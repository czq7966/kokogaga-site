import { Base } from "./bast";
import { Room } from "./room";
import { Signaler } from "./signaler";


export class Rooms extends Base {
    signaler: Signaler
    rooms: {[id: string]: Room}
    constructor(signaler: Signaler) {
        super();
        this.signaler = signaler;
        this.rooms = {}
    }
    destroy() {
        Object.keys(this.rooms).forEach(key => {
            let room = this.rooms[key];
            room.destroy();
        })
        delete this.signaler;
        delete this.rooms;
        super.destroy();
    }
    newRoom(roomid: string, password?: string): Room {
        if (roomid) {
            let room = new Room({roomid: roomid, password: password});
            room.signaler = this.signaler;
            this.rooms[roomid] = room;
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

}