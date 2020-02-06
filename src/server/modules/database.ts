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
    isReady(): boolean
    syncData(): boolean 
    //User
    newUserShortID(len?: number, notUseEvent?: boolean): Promise<string>
    getUser(user: Dts.IUser, notUseEvent?: boolean): Promise<Dts.IUser>
    existUser(user: Dts.IUser, notUseEvent?: boolean): Promise<boolean>
    addUser(user: Dts.IUser, notUseEvent?: boolean): Promise<boolean>
    delUser(user: Dts.IUser, notUseEvent?: boolean): Promise<boolean>

    onNewUserShortID?: (len?: number) => Promise<string>
    onGetUser?: (user: Dts.IUser) => Promise<Dts.IUser>
    onExistUser?: (user: Dts.IUser) => Promise<boolean>
    onAddUser?: (user: Dts.IUser) => Promise<boolean>
    onDelUser?: (user: Dts.IUser) => Promise<boolean>

    //Room
    getRoom(roomid: string, notUseEvent?: boolean): Promise<Dts.IRoom>
    createRoom(roomid: string, room?: Dts.IRoom, notUseEvent?: boolean): Promise<Dts.IRoom>
    existRoom(roomid: string, notUseEvent?: boolean): Promise<boolean>
    openRoom( roomid: string, notUseEvent?: boolean): Promise<Dts.IRoom>
    closeRoom(roomid: string, notUseEvent?: boolean): Promise<Dts.IRoom>
    changeRoomId(oldId: string, newId: string, notUseEvent?: boolean): Promise<boolean>

    onGetRoom?: (roomid: string) => Promise<Dts.IRoom>
    onCreateRoom?: (roomid: string) => Promise<Dts.IRoom>
    onExistRoom?: (roomid: string) => Promise<boolean>
    onOpenRoom?: ( roomid: string) => Promise<Dts.IRoom>
    onCloseRoom?: (roomid: string) => Promise<Dts.IRoom>
    onChangeRoomId?: (oldId: string, newId: string) => Promise<boolean>    

    //Room Users    
    joinRoom(roomid: string, user: Dts.IUser, notUseEvent?: boolean):  Promise<boolean> 
    leaveRoom(roomid: string, user: Dts.IUser, closeWhileNoUser: boolean, notUseEvent?: boolean): Promise<boolean>
    joinOrCreateRoom(roomid: string, user: Dts.IUser, notUseEvent?: boolean): Promise<boolean>
    leaveOrCloseRoom(roomid: string, user: Dts.IUser, notUseEvent?: boolean): Promise<boolean>
    getRoomUsersCount(roomid: string, notUseEvent?: boolean): Promise<number>

    onJoinRoom?: (roomid: string, user: Dts.IUser) =>  Promise<boolean> 
    onLeaveRoom?: (roomid: string, user: Dts.IUser, closeWhileNoUser: boolean) => Promise<boolean>
    onJoinOrCreateRoom?: (roomid: string, user: Dts.IUser) => Promise<boolean>
    onLeaveOrCloseRoom?: (roomid: string, user: Dts.IUser) => Promise<boolean>
    onGetRoomUsersCount?: (roomid: string) => Promise<number>    

}
export interface IDataNamespaces extends Cmds.Common.Helper.IKeyValue<IDataNamespace> {}
export interface IDatabase {
    destroy()
    getPath(): string
    getServer(): IServer
    isReady(): boolean
    createNamespace(namespace: string): IDataNamespace 
    destroyNamespace(namespace: string)
    getNamespace(namespace: string): IDataNamespace
    getNamespaces(): IDataNamespaces
    syncData(): boolean
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
    onLeaveRoom?: (roomid: string, user: Dts.IUser, closeWhileNoUser: boolean) => Promise<boolean>
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
    isReady(): boolean {
        return this.database.isReady()
    }
    syncData(): boolean {
        return true;
    }
    //User
    async newUserShortID(len?: number, notUseEvent?: boolean): Promise<string> {
        if (this.onNewUserShortID && !notUseEvent) return this.onNewUserShortID(len);
        //
        len = len || 6;
        let sid = Cmds.Common.Helper.uuid(len, 10)
        if (this.shortUsers.exist(sid)) {
            return await this.newUserShortID()
        } else {
            return sid
        }        
    }
    async getUser(user: Dts.IUser, notUseEvent?: boolean): Promise<Dts.IUser> {
        if (this.onGetUser && !notUseEvent) return this.onGetUser(user);
        //        
        let nspUser: Dts.IUser;
        if (user) {        
            if (user.id)
                nspUser = this.users.get(user.id);
            if (!nspUser && user.sid)
                nspUser = this.shortUsers.get(user.sid)
            if (!nspUser && user.socketId)
                nspUser = this.socketUsers.get(user.socketId)      
        }
        return nspUser;        
    }
    async existUser(user: Dts.IUser, notUseEvent?: boolean): Promise<boolean> {
        if (this.onExistUser && !notUseEvent) return this.onExistUser(user);
        //        
        let exist = await this.getUser(user);
        return !!exist;        
    }
    async addUser(user: Dts.IUser, notUseEvent?: boolean): Promise<boolean> {
        if (this.onAddUser && !notUseEvent) return this.onAddUser(user);
        //        
        user.id && this.users.add(user.id, user)
        user.sid && this.shortUsers.add(user.sid, user);
        user.socketId && this.socketUsers.add(user.socketId, user);
        return true;
    }
    async delUser(user: Dts.IUser, notUseEvent?: boolean): Promise<boolean> {
        if (this.onDelUser && !notUseEvent) return this.onDelUser(user);
        //  
        this.users.del(user.id)
        this.shortUsers.del(user.sid)
        this.socketUsers.del(user.socketId);
        return true;
    }
    //Room
    async getRoom(roomid: string, notUseEvent?: boolean): Promise<Dts.IRoom> {
        if (this.onGetRoom && !notUseEvent) return this.onGetRoom(roomid);
        //        
        return this.rooms.get(roomid);        
    }
    async createRoom(roomid: string, room?: Dts.IRoom, notUseEvent?: boolean): Promise<Dts.IRoom> {
        if (this.onCreateRoom && !notUseEvent) return this.onCreateRoom(roomid);
        //        
        let uroom = this.rooms.get(roomid);
        if (!uroom) {
            uroom = room || {
                id: roomid,
                sim: Cmds.Common.Helper.uuid()
            }
            this.rooms.add(roomid, uroom);
        } else {
            if(room && (uroom.sim != room.sim)) {
                this.rooms.add(roomid, room)
            }
        }
        return uroom;           
    }
    async existRoom(roomid: string, notUseEvent?: boolean): Promise<boolean> {
        if (this.onExistRoom && !notUseEvent) return this.onExistRoom(roomid);
        //        
        let uroom = await this.getRoom(roomid);
        return !!uroom;
    }
    async openRoom( roomid: string, notUseEvent?: boolean): Promise<Dts.IRoom> {
        if (this.onOpenRoom && !notUseEvent) return this.onOpenRoom(roomid);
        //        

        let exist = this.rooms.exist(roomid)
        if (!exist) {
            this.createRoom(roomid);
            return this.rooms.get(roomid);
        } else {
            throw 'Room already exist!'
        }       
    }
    async closeRoom(roomid: string, notUseEvent?: boolean): Promise<Dts.IRoom> {
        if (this.onCloseRoom && !notUseEvent) return this.onCloseRoom(roomid);
        //        
        let users = this.roomUsers.get(roomid);
        if (users) {
            let promises = [];            
            users.values().forEach(user => {
                promises.push(this.leaveRoom(roomid, user, false))
            })
            await Promise.all(promises);            
        }

        this.roomUsers.del(roomid)
        return this.rooms.del(roomid);        
    }
    async changeRoomId(roomOldId: string, roomNewId: string, notUseEvent?: boolean): Promise<boolean> {
        if (this.onChangeRoomId && !notUseEvent) return this.onChangeRoomId(roomOldId, roomNewId);
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
    async joinRoom(roomid: string, user: Dts.IUser, notUseEvent?: boolean):  Promise<boolean>  {
        if (this.onJoinRoom && !notUseEvent) return this.onJoinRoom(roomid, user);
        //        
        let room = await this.getRoom(roomid);
        if (room) {
            let users = this.roomUsers.get(room.id)
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

    async leaveRoom(roomid: string, user: Dts.IUser, closeWhileNoUser: boolean, notUseEvent?: boolean): Promise<boolean> {
        if (this.onLeaveRoom && !notUseEvent) return this.onLeaveRoom(roomid, user, closeWhileNoUser);
        //        
        let users = this.roomUsers.get(roomid);
        if (users && user) {
            users.del(user.id);
            if (users.count() <=0) {
                this.roomUsers.del(roomid);
                if (closeWhileNoUser && this.rooms.exist(roomid)) {
                    this.rooms.del(roomid)                    
                }
            }
        } else {
            Logging.error('Error: leaveRoom: roomid:' + roomid, user)
        }
        return true;
    }
    async joinOrCreateRoom(roomid: string, user: Dts.IUser, notUseEvent?: boolean): Promise<boolean> {
        if (this.joinOrCreateRoom && !notUseEvent) return this.joinOrCreateRoom(roomid, user);
        //        
        await this.createRoom(roomid);
        return await this.joinRoom(roomid, user);       
    }
    async leaveOrCloseRoom(roomid: string, user: Dts.IUser, notUseEvent?: boolean): Promise<boolean> {
        if (this.onLeaveOrCloseRoom && !notUseEvent) return this.onLeaveOrCloseRoom(roomid, user);
        //        
        return await this.leaveRoom(roomid, user, true);
    }    
    async getRoomUsersCount(roomid: string, notUseEvent?: boolean ): Promise<number> {
        if (this.onGetRoomUsersCount && !notUseEvent) return this.onGetRoomUsersCount(roomid);
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
    constructor(server: IServer, path: string) {
        this.server = server;
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
    isReady(): boolean {
        return true;
    }
    syncData(): boolean {
        this.namespaces.keys().forEach(key => {
            let namespace = this.namespaces.get(key);
            namespace.syncData();
        })
        return true;
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
    getNamespaces(): IDataNamespaces {
        return this.namespaces;
    }

}