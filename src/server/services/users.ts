import * as Dts from "../dts";
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'


export class ServiceUsers  {
    static async newShortID(sckUsers: Modules.ISocketUsers): Promise<string> {
        return sckUsers.getDataNamespace().newUserShortID();
    }  

    static async getSocketUser(sckUsers: Modules.ISocketUsers, user: Dts.IUser): Promise<Modules.ISocketUser> {
        let sckUser: Modules.ISocketUser;
        let nspUser = await sckUsers.getDataNamespace().getUser(user);
        if (nspUser) {
            if (!sckUser && nspUser.id)
                sckUser = sckUsers.users.get(nspUser.id);
            if (!sckUser && nspUser.sid)
                sckUser = sckUsers.shortUsers.get(nspUser.sid)
            if (!sckUser && nspUser.socketId)
                sckUser = sckUsers.sockets.get(nspUser.socketId)            
        }
        return sckUser;
    }    
    static async existSocketUser(sckUsers: Modules.ISocketUsers, user: Dts.IUser): Promise<boolean> {
        let exist = await this.getSocketUser(sckUsers, user);
        return !!exist;
    }
    static async addSocketUser(sckUsers: Modules.ISocketUsers, sckUser: Modules.ISocketUser): Promise<boolean> {
        let user = sckUser.user;
        if (user) {
            let existUser = await this.existSocketUser(sckUsers, user)
            if (!existUser) {
                await sckUsers.getDataNamespace().addUser(user);
                sckUsers.users.add(user.id, sckUser)
                sckUsers.sockets.add(user.socketId, sckUser);
                sckUsers.shortUsers.add(user.sid, sckUser)
                return true;
            }
        }
        return false
    }
    static async delSocketUser(sckUsers: Modules.ISocketUsers, sckUser: Modules.ISocketUser): Promise<boolean> {
        let user = sckUser.user;
        if (user) {
            // let exist = await this.existSocketUser(sckUsers, user);
            // if (exist) {
                await sckUsers.getDataNamespace().delUser(user);
                sckUsers.users.del(user.id)
                sckUsers.sockets.del(user.socketId);
                sckUsers.shortUsers.del(user.sid);
                return true;
            // }
        }
        return false
    }   
    static addRoom(sckUsers: Modules.ISocketUsers, room: Dts.IRoom, notForce?: boolean): Dts.IRoom {
        if (room && (!sckUsers.rooms.exist(room.id) || !notForce)) {
            sckUsers.rooms.add(room.id, room);
        }
        return room
    }
    static delRoom(sckUsers: Modules.ISocketUsers, roomid: string, notForce?: boolean) {
        if (sckUsers.rooms.exist(roomid) || !notForce) {
            sckUsers.rooms.del(roomid);
        }
    }     
}