import * as Dts from "../dts";
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'


export class ServiceUsers  {
    static getDatabaseNamespace(sckUsers: Modules.ISocketUsers): Modules.IDataNamespace {
        return sckUsers.snsp.server.database.getNamespace(sckUsers.snsp.options.name)
    }
    static async newShortID(sckUsers: Modules.ISocketUsers): Promise<string> {
        return this.getDatabaseNamespace(sckUsers).newUserShortID();
        // let sid = Cmds.Common.Helper.uuid(6, 10)
        // if (sckUsers.shortUsers.exist(sid)) {
        //     return await this.newShortID(sckUsers)
        // } else {
        //     return sid
        // }
    }
    // static async getUser(sckUsers: Modules.ISocketUsers, user: Dts.IUser): Promise<Modules.ISocketUser> {
    //     let sckUser;
    //     let nspUser = await this.getDatabaseNamespace(sckUsers).getUser(user);
    //     if (nspUser)
    //         sckUser = sckUsers.users.get(nspUser.id);
    //     return sckUser;

    //     // let sckUser;
    //     // if (user.id)
    //     //     sckUser = sckUsers.users.get(user.id);
    //     // if (!sckUser && user.sid)
    //     //     sckUser = sckUsers.shortUsers.get(user.sid)
    //     // return sckUser;
    // }    
    // static async existUser(sckUsers: Modules.ISocketUsers, user: Dts.IUser): Promise<boolean> {
    //     let exist = await ServiceUsers.getUser(sckUsers, user);
    //     return !!exist;
    // }
    // static async addUser(sckUsers: Modules.ISocketUsers, sckUser: Modules.ISocketUser): Promise<boolean> {
    //     let existUser = await this.existUser(sckUsers, sckUser.user)
    //     if (!existUser) {
    //         sckUsers.users.add(sckUser.user.id, sckUser)
    //         sckUsers.sockets.add(sckUser.socket.id, sckUser);
    //         sckUser.user.sid && sckUsers.shortUsers.add(sckUser.user.sid, sckUser)
    //         return true;
    //     }
    //     return false
    // }
    // static async delUser(sckUsers: Modules.ISocketUsers, sckUser: Modules.ISocketUser): Promise<boolean> {
    //     let exist = await this.existUser(sckUsers, sckUser.user);
    //     if (exist) {
    //         sckUsers.users.del(sckUser.user.id)
    //         sckUsers.sockets.del(sckUser.socket.id);
    //         sckUsers.shortUsers.del(sckUser.user.sid)
    //         return true;
    //     }
    //     return false
    // }    

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
            sckUser.user.sid && sckUsers.shortUsers.add(sckUser.user.sid, sckUser)
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
 
}