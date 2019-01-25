import * as Cmds from '../cmds/index'

import * as Modules from '../modules'

export class ServiceRoom extends Cmds.Common.Base {

    static exist(roomid: string, sckUser: Modules.SocketUser): boolean {
        let room = sckUser.socket.adapter.rooms[roomid];
        return !!room;
    }
    static open(roomid: string, sckUser: Modules.SocketUser): Promise<any> {
        return new Promise((resolve, reject) => {
            sckUser.socket.join(roomid, err => {
                if (err) {
                    reject(err)                    
                } else {
                    resolve(roomid)
                }
            })
        })
    }
    static join(roomid: string, sckUser: Modules.SocketUser): boolean {
        if (ServiceRoom.exist(roomid, sckUser)) {
            sckUser.socket.join(roomid);
            return true;
        } else {
            return false
        }
    }
}