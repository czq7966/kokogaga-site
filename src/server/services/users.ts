import * as Dts from "../dts";
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'


export class ServiceUsers  {
    static getDatabaseNamespace(sckUsers: Modules.ISocketUsers): Modules.IDataNamespace {
        return sckUsers.snsp.server.getDatabase().getNamespace(sckUsers.snsp.options.name)
    }
    static async newShortID(sckUsers: Modules.ISocketUsers): Promise<string> {
        return this.getDatabaseNamespace(sckUsers).newUserShortID();
    }  

    static async getSocketUser(sckUsers: Modules.ISocketUsers, user: Dts.IUser): Promise<Modules.ISocketUser> {
        let sckUser: Modules.ISocketUser;
        let nspUser = await this.getDatabaseNamespace(sckUsers).getUser(user);
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
        let existUser = await this.existSocketUser(sckUsers, sckUser.user)
        if (!existUser) {
            await this.getDatabaseNamespace(sckUsers).addUser(sckUser.user);
            sckUsers.users.add(sckUser.user.id, sckUser)
            sckUsers.sockets.add(sckUser.socket.id, sckUser);
            sckUsers.shortUsers.add(sckUser.user.sid, sckUser)
            return true;
        }
        return false
    }
    static async delSocketUser(sckUsers: Modules.ISocketUsers, sckUser: Modules.ISocketUser): Promise<boolean> {
        let exist = await this.existSocketUser(sckUsers, sckUser.user);
        if (exist) {
            await this.getDatabaseNamespace(sckUsers).delUser(sckUser.user);
            sckUsers.users.del(sckUser.user.id)
            sckUsers.sockets.del(sckUser.socket.id);
            sckUsers.shortUsers.del(sckUser.user.sid);
            return true;
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