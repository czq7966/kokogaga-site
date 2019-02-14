import * as Dts from "../dts";
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'


export class ServiceUsers  {
    static newShortID(sckUsers: Modules.ISocketUsers): string {
        let sid = Cmds.Common.Helper.uuid(4, 10)
        if (sckUsers.shortUsers.exist(sid)) {
            return this.newShortID(sckUsers)
        } else {
            return sid
        }
    }
    static existUser(sckUsers: Modules.ISocketUsers, user: Dts.IUser): Boolean {
        let exist = false;
        exist = sckUsers.users.exist(user.id);
        if (!exist && user.sid)
            exist = sckUsers.shortUsers.exist(user.sid)
        return exist;
    }
    static addUser(sckUsers: Modules.ISocketUsers, sckUser: Modules.ISocketUser): boolean {
        if (!this.existUser(sckUsers, sckUser.user)) {
            sckUsers.users.add(sckUser.user.id, sckUser)
            sckUser.user.sid && sckUsers.shortUsers.add(sckUser.user.sid, sckUser)
            return true;
        }
        return false
    }
    static delUser(sckUsers: Modules.ISocketUsers, sckUser: Modules.ISocketUser): boolean {
        if (this.existUser(sckUsers, sckUser.user)) {
            sckUsers.users.del(sckUser.user.id)
            sckUsers.shortUsers.del(sckUser.user.sid)
            return true;
        }
        return false
    }    

 
}