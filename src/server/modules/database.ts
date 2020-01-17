import * as Dts from "../dts";
import * as Cmds from "../cmds/index";
import { IServer } from "./server";

export interface IDataUsers extends Cmds.Common.Helper.IKeyValue<Dts.IUser> {}
export interface IDataSocketUsers extends IDataUsers{}
export interface IDataShortUsers extends IDataUsers{}
export interface IDataRooms extends Cmds.Common.Helper.IKeyValue<Dts.IRoom> {}
export interface IDataRoomUsers extends Cmds.Common.Helper.IKeyValue<IDataUsers> {}
export interface IDataNamespace {
    database?: IDatabase;
    path?: string
    name?: string    
    users?: IDataUsers
    socketUsers?: IDataSocketUsers
    shortUsers?: IDataShortUsers
    rooms?:  IDataRooms
    roomUsers?: IDataRoomUsers 

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

    onNewUserShortID?: (len?: number) => Promise<string>
    onGetUser?: (user: Dts.IUser) => Promise<Dts.IUser>
    onExistUser?: (user: Dts.IUser) => Promise<boolean>
    onAddUser?: (user: Dts.IUser) => Promise<boolean>
    onDelUser?: (user: Dts.IUser) => Promise<boolean>

    //Room
    getRoom(roomid: string): Promise<Dts.IRoom>
    createRoom(roomid: string): Promise<Dts.IRoom>
    existRoom(roomid: string): Promise<boolean>
    openRoom( roomid: string): Promise<Dts.IRoom>
    closeRoom(roomid: string): Promise<Dts.IRoom>
    changeRoomId(oldId: string, newId: string): Promise<boolean>

    onGetRoom?: (roomid: string) => Promise<Dts.IRoom>
    onCreateRoom?: (roomid: string) => Promise<Dts.IRoom>
    onExistRoom?: (roomid: string) => Promise<boolean>
    onOpenRoom?: ( roomid: string) => Promise<Dts.IRoom>
    onCloseRoom?: (roomid: string) => Promise<Dts.IRoom>
    onChangeRoomId?: (oldId: string, newId: string) => Promise<boolean>    

    //Room Users    
    joinRoom(roomid: string, user: Dts.IUser):  Promise<boolean> 
    leaveRoom(roomid: string, user: Dts.IUser): Promise<boolean>
    joinOrCreateRoom(roomid: string, user: Dts.IUser): Promise<boolean>
    leaveOrCloseRoom(roomid: string, user: Dts.IUser): Promise<boolean>
    getRoomUsersCount(roomid: string): Promise<number>

    onJoinRoom?: (roomid: string, user: Dts.IUser) =>  Promise<boolean> 
    onLeaveRoom?: (roomid: string, user: Dts.IUser) => Promise<boolean>
    onJoinOrCreateRoom?: (roomid: string, user: Dts.IUser) => Promise<boolean>
    onLeaveOrCloseRoom?: (roomid: string, user: Dts.IUser) => Promise<boolean>
    onGetRoomUsersCount?: (roomid: string) => Promise<number>    

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
    onNewUserShortID?: (len?: number) => Promise<string>
    onGetUser?: (user: Dts.IUser) => Promise<Dts.IUser>
    onExistUser?: (user: Dts.IUser) => Promise<boolean>
    onAddUser?: (user: Dts.IUser) => Promise<boolean>
    onDelUser?: (user: Dts.IUser) => Promise<boolean>
    onGetRoom?: (roomid: string) => Promise<Dts.IRoom>
    onCreateRoom?: (roomid: string) => Promise<Dts.IRoom>
    onExistRoom?: (roomid: string) => Promise<boolean>
    onOpenRoom?: ( roomid: string) => Promise<Dts.IRoom>
    onCloseRoom?: (roomid: string) => Promise<Dts.IRoom>
    onChangeRoomId?: (oldId: string, newId: string) => Promise<boolean>   
    onJoinRoom?: (roomid: string, user: Dts.IUser) =>  Promise<boolean> 
    onLeaveRoom?: (roomid: string, user: Dts.IUser) => Promise<boolean>
    onJoinOrOpenRoom?: (roomid: string, user: Dts.IUser) => Promise<boolean>
    onLeaveOrCloseRoom?: (roomid: string, user: Dts.IUser) => Promise<boolean>
    onGetRoomUsersCount?: (roomid: string) => Promise<number>       
    constructor(database: IDatabase, path:string, name: string) {
        this.database = database;
        this.path = path;
        this.name = name;
        this.users = new DataUsers(true, this);
        this.socketUsers = new DataSocketUsers(true, this);
        this.shortUsers = new DataShortUsers(true, this);
        this.rooms = new DataRooms(true, this);
        this.roomUsers = new DataRoomUsers(true, this);
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
        if (this.onNewUserShortID) return this.onNewUserShortID(len);
        //
        len = len || 6;
        let sid = Cmds.Common.Helper.uuid(len, 10)
        if (this.shortUsers.exist(sid)) {
            return await this.newUserShortID()
        } else {
            return sid
        }        
    }
    async getUser(user: Dts.IUser): Promise<Dts.IUser> {
        if (this.onGetUser) return this.onGetUser(user);
        //        
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
        if (this.onExistUser) return this.onExistUser(user);
        //        
        let exist = await this.getUser(user);
        return !!exist;        
    }
    async addUser(user: Dts.IUser): Promise<boolean> {
        if (this.onAddUser) return this.onAddUser(user);
        //        
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
        if (this.onDelUser) return this.onDelUser(user);
        //  
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
        if (this.onGetRoom) return this.onGetRoom(roomid);
        //        
        return this.rooms.get(roomid);        
    }
    async createRoom(roomid: string): Promise<Dts.IRoom> {
        if (this.onCreateRoom) return this.onCreateRoom(roomid);
        //        
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
        if (this.onExistRoom) return this.onExistRoom(roomid);
        //        
        let uroom = await this.getRoom(roomid);
        return !!uroom;
    }
    async openRoom( roomid: string): Promise<Dts.IRoom> {
        if (this.onOpenRoom) return this.onOpenRoom(roomid);
        //        
        let exist = await this.existRoom(roomid)
        if (!exist) {
            let room = await this.createRoom(roomid);
            return room;
        } else {
            throw 'Room already exist!'
        }       
    }
    async closeRoom(roomid: string): Promise<Dts.IRoom> {
        if (this.onCloseRoom) return this.onCloseRoom(roomid);
        //        
        let users = await this.roomUsers.del(roomid);
        users && users.destroy();
        return await this.rooms.del(roomid);        
    }
    async changeRoomId(roomOldId: string, roomNewId: string): Promise<boolean> {
        if (this.onChangeRoomId) return this.onChangeRoomId(roomOldId, roomNewId);
        //        
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
        if (this.onJoinRoom) return this.onJoinRoom(roomid, user);
        //        
        let room = await this.getRoom(roomid);
        if (room) {
            let users = await this.roomUsers.get(room.id)
            if (!users) {
                users = new DataUsers(true, room);
                this.roomUsers.add(room.id, users);
            }
            users.add(user.id, user);
            return true;
        } else {
            throw 'Room not exist';
        }
    }

    async leaveRoom(roomid: string, user: Dts.IUser): Promise<boolean> {
        if (this.onLeaveRoom) return this.onLeaveRoom(roomid, user);
        //        
        let users = await this.roomUsers.get(roomid);
        if (users && user) {
            users.del(user.id)
        }
        return true;
    }
    async joinOrCreateRoom(roomid: string, user: Dts.IUser): Promise<boolean> {
        if (this.joinOrCreateRoom) return this.joinOrCreateRoom(roomid, user);
        //        
        let existRoom = await this.existRoom(roomid);
        if (!existRoom) {
            await this.createRoom(roomid);
        }
        return await this.joinRoom(roomid, user);       
    }
    async leaveOrCloseRoom(roomid: string, user: Dts.IUser): Promise<boolean> {
        if (this.onLeaveOrCloseRoom) return this.onLeaveOrCloseRoom(roomid, user);
        //        
        await this.leaveRoom(roomid, user);
        let count = await this.getRoomUsersCount(roomid);
        if (count <= 0) {
            this.closeRoom(roomid)
        }
        return true;     
    }    
    async getRoomUsersCount(roomid: string): Promise<number> {
        if (this.onGetRoomUsersCount) return this.onGetRoomUsersCount(roomid);
        //        
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