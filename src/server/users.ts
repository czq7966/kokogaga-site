import { SocketUser, IUserSocket } from "./user";
import * as Dts from "./dts";
import { Base } from "./base";
import * as Cmds from "./cmds/index";

export interface ISocketNamespace extends SocketIO.Namespace {
    users?: SocketUsers
}

export class SocketUsers extends Base {
    nsp: ISocketNamespace
    users: Cmds.Helper.KeyValue<SocketUser>;
    sockets: Cmds.Helper.KeyValue<SocketUser>;
    constructor(nsp: ISocketNamespace) {
        super();
        this.nsp = nsp;
        this.nsp.users = this;
        this.users = new Cmds.Helper.KeyValue();
        this.sockets = new Cmds.Helper.KeyValue();
        this.initEvents();
    }
    destroy() {
        this.clearSocketUsers();
        this.users.destroy();
        this.sockets.destroy();
        delete this.users;
        delete this.sockets;
        delete this.nsp.users;
        delete this.nsp;
        super.destroy();
    }

    initEvents() {
        this.nsp.on('connect', this.onConnect)
    }
    onConnect = (socket: SocketIO.Socket) => {
        console.log('ServerEvent', 'connect', socket.id)
        let sckUser = new SocketUser(socket);
        socket.once(Dts.EServerSocketEvents.disconnect, () => {
            sckUser.destroy();
            sckUser = null;
        });
    }     
    
    // SocketUser逻辑业务

    newSocketUser(user: Dts.IUser, socket: IUserSocket): SocketUser {
        let sckUser = new SocketUser(socket);
        this.addSocketUser(sckUser);
        return sckUser;
    }
    
    getSocketUser(userid: string): SocketUser {
        return this.users.get(userid)
    }

    addSocketUser(sckUser: SocketUser) {
        this.delSocketUser(sckUser.user.id);
        this.users.add(sckUser.user.id, sckUser);
        this.sockets.add(sckUser.socket.id, sckUser);
    }
    delSocketUser(userid: string): SocketUser {
        let sckUser = this.getSocketUser(userid);
        if (sckUser) {
            this.users.del(userid);
            this.sockets.del(sckUser.socket.id)
            return sckUser;
        }
    }
    removeSocketUser(userid: string): SocketUser {
        let sckUser = this.getSocketUser(userid);
        if (sckUser) {
            this.users.del(userid);
            this.sockets.del(sckUser.socket.id)            
        }        
        return sckUser;
    }
    existSocketUser(userid: string): boolean {
        return this.users.exist(userid);
    }
    clearSocketUsers() {
        this.users.keys().forEach(userid => {
            this.delSocketUser(userid)
        })
    }


    getUserBySocketId(sid: string): SocketUser {
        return this.sockets.get(sid)
    }    
   
    //Room Business
    getAdhocRoomId(user: SocketUser) {
        return Dts.ERoomPrefix.adhoc  + user.socket.conn.remoteAddress;
    }

    joinAdhocRoom(user: SocketUser): Promise<any> {
        return new Promise((resolve, reject) => {
            let roomid = this.getAdhocRoomId(user);
            user.user.room = {id: roomid};
            user.socket.join(roomid, err => {
                if (err) {
                    reject(err)    
                } else {
                    resolve(roomid)    
                }
            });
        })        
    }
    leaveAdhocRoom(user: SocketUser): Promise<any> {
        return new Promise((resolve, reject) => {
            let roomid = this.getAdhocRoomId(user);
            user.user.room = {id: roomid};
            user.socket.leave(roomid, err => {
                if (err) {
                    reject(err)    
                } else {
                    resolve(roomid)    
                }
            });
        })        
    }    
}