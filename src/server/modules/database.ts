import * as Dts from "../dts";
import * as Cmds from "../cmds/index";
import { IServer } from "./server";

export interface IDataUsers extends Cmds.Common.Helper.IKeyValue<Dts.IUser> {}
export interface IDataSocketUsers extends IDataUsers{}
export interface IDataShortUsers extends IDataUsers{}
export interface IDataRooms extends Cmds.Common.Helper.IKeyValue<Dts.IRoom> {}
export interface IDataRoomUsers extends Cmds.Common.Helper.IKeyValue<IDataUsers> {}
export interface IDataNamespace {
    destroy()
    //Props
    getDatabase(): IDatabase;
    getPath(): string
    getName(): string      
    //User
    newUserShortID(len?: number): Promise<string>
    getUser(user: Dts.IUser): Promise<Dts.IUser>
    existUser(user: Dts.IUser): Promise<boolean>
    addUser(user: Dts.IUser): Promise<boolean>
    delUser(user: Dts.IUser): Promise<boolean>
    //Room
    getRoom(roomid: string): Promise<Dts.IRoom>
    createRoom(roomid: string): Promise<Dts.IRoom>
    existRoom(roomid: string): Promise<boolean>
    openRoom( roomid: string): Promise<Dts.IRoom>
    closeRoom(roomid: string): Promise<Dts.IRoom>
    changeRoomId(oldId: string, newId: string): Promise<boolean>
    //Room Users    
    joinRoom(roomid: string, user: Dts.IUser):  Promise<boolean> 
    leaveRoom(roomid: string, user: Dts.IUser): Promise<boolean>
    joinOrOpenRoom(roomid: string, user: Dts.IUser): Promise<boolean>
    leaveOrCloseRoom(roomid: string, user: Dts.IUser): Promise<boolean>
    getRoomUserCount(roomid: string): Promise<number>


}
export interface IDataNamespaces extends Cmds.Common.Helper.IKeyValue<IDataNamespace> {}
export interface IDatabase {
    destroy()
    getPath(): string
    getServer(): IServer
    createNamespace(namespace: string): IDataNamespace 
    destroyNamespace(namespace: string)
    getNamespace(namespace: string): IDataNamespace
}
export class DataUsers extends Cmds.Common.Helper.KeyValue<Dts.IUser> implements IDataUsers {}
export class DataSocketUsers extends DataUsers implements IDataSocketUsers {}
export class DataShortUsers extends DataUsers implements DataShortUsers {}
export class DataRooms extends Cmds.Common.Helper.KeyValue<Dts.IRoom> implements IDataRooms {}
export class DataRoomUsers extends Cmds.Common.Helper.KeyValue<IDataUsers> implements IDataRoomUsers {}
export class DataNamespace implements IDataNamespace {
    database: IDatabase;
    path: string
    name: string    
    users: IDataUsers
    socketUsers: IDataSocketUsers
    shortUsers: IDataShortUsers
    rooms:  IDataRooms
    roomUsers: IDataRoomUsers    
    constructor(database: IDatabase, path:string, name: string) {
        this.database = database;
        this.path = path;
        this.name = name;
        this.users = new DataUsers();
        this.socketUsers = new DataSocketUsers();
        this.shortUsers = new DataShortUsers();
        this.rooms = new DataRooms();
        this.roomUsers = new DataRoomUsers();
    }
    destroy() {
        this.users.destroy();
        this.socketUsers.destroy();
        this.shortUsers.destroy();
        this.rooms.destroy();
        this.roomUsers.destroy();
        delete this.users;
        delete this.socketUsers;
        delete this.shortUsers;
        delete this.rooms;
        delete this.roomUsers;
    }
    //Props
    getDatabase(): IDatabase {
        return this.database;
    }
    getPath(): string {
        return this.path;
    }
    getName(): string {
        return this.name;
    }      
    //User
    async newUserShortID(len?: number): Promise<string> {
        len = len || 6;
        let sid = Cmds.Common.Helper.uuid(len, 10)
        if (this.shortUsers.exist(sid)) {
            return await this.newUserShortID()
        } else {
            return sid
        }        
    }
    async getUser(user: Dts.IUser): Promise<Dts.IUser> {
        let nspUser: Dts.IUser;
        if (user.id)
            nspUser = this.users.get(user.id);
        if (!nspUser && user.sid)
            nspUser = this.shortUsers.get(user.sid)
        if (!nspUser && user.socketId)
            nspUser = this.socketUsers.get(user.socketId)            
        return nspUser;        
    }
    async existUser(user: Dts.IUser): Promise<boolean> {
        let exist = await this.getUser(user);
        return !!exist;        
    }
    async addUser(user: Dts.IUser): Promise<boolean> {
        let existUser = await this.existUser(user)
        if (!existUser) {
            user.id && this.users.add(user.id, user)
            user.sid && this.shortUsers.add(user.sid, user);
            user.socketId && this.socketUsers.add(user.socketId, user);
            return true;
        }
        return false        
    }
    async delUser(user: Dts.IUser): Promise<boolean> {
        let existUser = await this.getUser(user);
        if (existUser) {
            this.users.del(existUser.id)
            this.shortUsers.del(existUser.sid)
            this.socketUsers.del(existUser.socketId);
            return true;
        }
        return false        
    }
    //Room
    async getRoom(roomid: string): Promise<Dts.IRoom> {
        return this.rooms.get(roomid);        
    }
    async createRoom(roomid: string): Promise<Dts.IRoom> {
        let uroom = await this.getRoom(roomid);
        if (!uroom) {
            uroom = {
                id: roomid,
                sim: Cmds.Common.Helper.uuid()
            }
            this.rooms.add(roomid, uroom);
        }
        return uroom;           
    }
    async existRoom(roomid: string): Promise<boolean> {
        let uroom = await this.getRoom(roomid);
        return !!uroom;
    }
    async openRoom( roomid: string): Promise<Dts.IRoom> {
        let exist = await this.existRoom(roomid)
        if (!exist) {
            let room = await this.createRoom(roomid);
            return room;
        } else {
            throw 'Room already exist!'
        }       
    }
    async closeRoom(roomid: string): Promise<Dts.IRoom> {
        let users = await this.roomUsers.del(roomid);
        users && users.destroy();
        return await this.rooms.del(roomid);        
    }
    async changeRoomId(roomOldId: string, roomNewId: string): Promise<boolean> {
        let room = await this.getRoom(roomOldId);
        if (room) {
            room.id = roomNewId;
            this.rooms.del(roomOldId);
            this.rooms.add(roomNewId, room)
            let users = this.roomUsers.get(roomOldId);
            if (users) {
                this.roomUsers.del(roomOldId);
                this.roomUsers.add(roomNewId, users);
            }
            return true
        } else {
            throw 'Room not exist ' + roomOldId;
        }        
    }
    //Room Users 
    async joinRoom(roomid: string, user: Dts.IUser):  Promise<boolean>  {
        let room = await this.getRoom(roomid);
        if (room) {
            let users = await this.roomUsers.get(room.id)
            if (!users) {
                users = new DataUsers()
                this.roomUsers.add(room.id, users);
            }
            users.add(user.id, user);
            return true;
        } else {
            throw 'Room not exist';
        }
    }

    async leaveRoom(roomid: string, user: Dts.IUser): Promise<boolean> {
        let users = await this.roomUsers.get(roomid);
        if (users) {
            users.del(user.id)
            users.count()
        }
        return true;
    }
    async joinOrOpenRoom(roomid: string, user: Dts.IUser): Promise<boolean> {
        let existRoom = await this.existRoom(roomid);
        if (!existRoom) {
            await this.createRoom(roomid);
        }
        return await this.joinRoom(roomid, user);       
    }
    async leaveOrCloseRoom(roomid: string, user: Dts.IUser): Promise<boolean> {
        await this.leaveRoom(roomid, user);
        let count = await this.getRoomUserCount(roomid);
        if (count <= 0) {
            this.closeRoom(roomid)
        }
        return true;     
    }    
    async getRoomUserCount(roomid: string): Promise<number> {
        let users = this.roomUsers.get(roomid);
        if (users)
            return users.count();
        else 
            return 0;
    }


}
export class DataNamespaces extends Cmds.Common.Helper.KeyValue<IDataNamespace> implements IDataNamespaces {
    destroy() {
        this.keys().forEach(key => {
            let value = this.del(key);
            value && value.destroy()
        })
        super.destroy();
    }
}

export class Database implements IDatabase {
    path: string
    namespaces: IDataNamespaces
    server: IServer
    constructor(path: string) {
        this.path = path;
        this.namespaces = new DataNamespaces();
    }
    destroy() {
        this.namespaces.destroy();
        delete this.path;
        delete this.namespaces;
    }
    getPath(): string {
        return this.path;
    }
    getServer(): IServer {
        return this.server;
    }   
    createNamespace(namespace: string): IDataNamespace {
        let nsp = this.namespaces.get(namespace)
        if (!nsp) {
            nsp = new DataNamespace(this, this.path, namespace)
            this.namespaces.add(namespace, nsp);
        }
        return nsp;
    }
    destroyNamespace(namespace: string) {
        let nsp = this.namespaces.get(namespace);
        nsp && nsp.destroy();
    }
    getNamespace(namespace: string): IDataNamespace {
        return this.namespaces.get(namespace)
    }

}