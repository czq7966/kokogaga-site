import { ADHOCCAST } from '../libex'
import { IDataNamespace, IDatabase } from '../../../modules/database';
import { IDatabaseWrap } from './database-wrap';
import { IRedisSignaler } from './redis-signaler';
import { timingSafeEqual } from 'crypto';

export interface IDataNamespaceWrap extends IDataNamespace {
    getSignaler(): IRedisSignaler
    getRoomChannel(id: string): string
    getRoomUsersChannel(id: string): string
    getUserChannel(id: string): string
    getShortChannel(id: string): string 
    getSocketChannel(id: string): string     
    
    redisAddUser(user:  ADHOCCAST.Dts.IUser): Promise<boolean>
    redisDelUser(user:  ADHOCCAST.Dts.IUser): Promise<boolean>
    redisAddRoomUser(roomid, user: ADHOCCAST.Dts.IUser): Promise<boolean>
    redisDelRoomUser(roomid, user: ADHOCCAST.Dts.IUser): Promise<boolean>
    redisAddRoom(room: ADHOCCAST.Dts.IRoom): Promise<boolean>
    redisDelRoom(room: ADHOCCAST.Dts.IRoom): Promise<boolean>
}
export class DataNamespaceWrap implements IDataNamespaceWrap {
    databasewrap: IDatabaseWrap;
    namespace: IDataNamespace;
    constructor(databasewrap: IDatabaseWrap, namespace: IDataNamespace) {
        this.databasewrap = databasewrap;
        this.namespace = namespace
    }
    destroy() {
        delete this.databasewrap;
        delete this.namespace;
    }
    getSignaler(): IRedisSignaler {return this.databasewrap.getSignaler();}
    getRoomChannel(id: string): string { return this.getSignaler().getRoomChannel(id, this.getName()) }
    getRoomUsersChannel(id: string): string { return this.getSignaler().getRoomUsersChannel(id, this.getName()) }
    getUserChannel(id: string): string { return this.getSignaler().getUserChannel(id, this.getName()) }
    getShortChannel(id: string): string { return this.getSignaler().getShortChannel(id, this.getName()) }
    getSocketChannel(id: string): string { return this.getSignaler().getSocketChannel(id, this.getName()) }    
    //Props
    getDatabase(): IDatabase {
        return this.namespace.getDatabase();
    }
    getPath(): string {
        return this.namespace.getPath();
    }
    getName(): string {
        return this.namespace.getName();
    }
    //User
    newUserShortID(len?: number): Promise<string> {
        return this.namespace.newUserShortID(len);
    }
    async getUser(user: ADHOCCAST.Dts.IUser): Promise<ADHOCCAST.Dts.IUser> {
        let nspUser: ADHOCCAST.Dts.IUser;
        let strUser: string;
        if (user) {
            if (user.id)
                strUser = await this.getSignaler().get(this.getUserChannel(user.id));
            if (!strUser && user.sid)
                strUser = await this.getSignaler().get(this.getShortChannel(user.sid));
            if (!strUser && user.socketId)
                strUser = await this.getSignaler().get(this.getSocketChannel(user.socketId));
            if (strUser)
                nspUser = JSON.parse(strUser);
        }
        return nspUser; 
    }
    async existUser(user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        let exist = await this.getUser(user);
        return !!exist;   
    }
    async addUser(user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        let existUser = await this.existUser(user)
        if (!existUser) {
            let result = await this.namespace.addUser(user);
            result && await this.redisAddUser(user);
            return result;
        }
        return false  
    }
    async delUser(user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        let existUser = await this.namespace.existUser(user);
        if (existUser) {
            let result = await this.namespace.delUser(user);
            result && await this.redisDelUser(user);            
            return result;
        }
        return false  
    }
    //Room
    async getRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        let nspRoom: ADHOCCAST.Dts.IRoom;
        let strRoom: string;
        strRoom = await this.getSignaler().get(this.getRoomChannel(roomid));
        if (strRoom) 
            nspRoom = JSON.parse(strRoom);
        return nspRoom; 
    }
    async createRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        let uroom = await this.getRoom(roomid);
        if (!uroom) {
            let result = await this.namespace.createRoom(roomid);   
            result && await this.redisAddRoom(result)    
        }
        return uroom;   
    }
    async existRoom(roomid: string): Promise<boolean> {
        let uroom = await this.getRoom(roomid);
        return !!uroom;        
    }
    async openRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        let exist = await this.existRoom(roomid)
        if (!exist) {
            let room = await this.createRoom(roomid);
            return room;
        } else {
            throw 'Room already exist!'
        }   
    }
    async closeRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        roomid && await this.getSignaler().unsubscribe(this.getRoomChannel(roomid));
        roomid && await this.getSignaler().del(this.getRoomUsersChannel(roomid)); 
        roomid && await this.getSignaler().del(this.getRoomChannel(roomid)); 
        return this.namespace.closeRoom(roomid);
    }
    changeRoomId(roomOldId: string, roomNewId: string): Promise<boolean> {
        return this.namespace.changeRoomId(roomOldId, roomNewId);
    }
    //Room Users 
    async joinRoom(roomid: string, user: ADHOCCAST.Dts.IUser):  Promise<boolean>  {
        let result = await this.namespace.joinRoom(roomid, user);
        if (result) {
            roomid && await this.redisAddRoomUser(roomid, user);
            roomid && await this.getSignaler().subscribe(this.getRoomChannel(roomid));
        }
        return result;
    }
    async leaveRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        let result = await this.namespace.leaveRoom(roomid, user);
        if (result) {
            roomid && await this.getSignaler().unsubscribe(this.getRoomChannel(roomid));
            roomid && await this.redisDelRoomUser(roomid, user);
        }

        return this.namespace.leaveRoom(roomid, user);
    }
    async joinOrOpenRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        let existRoom = await this.existRoom(roomid);
        if (!existRoom) {
            await this.createRoom(roomid);
        }2
        return await this.joinRoom(roomid, user);   
    }
    async leaveOrCloseRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        await this.leaveRoom(roomid, user);
        let count = await this.getRoomUserCount(roomid) || 0;
        if (count <= 0) {
            this.closeRoom(roomid)
        }
        return true;  
    }    
    async getRoomUserCount(roomid: string): Promise<number> {
        return await this.getSignaler().hlen(this.getRoomUsersChannel(roomid))
    }
    
    async redisAddUser(user:  ADHOCCAST.Dts.IUser): Promise<boolean> {
        let strUser =  JSON.stringify(user);
        user.id && await this.getSignaler().set(this.getUserChannel(user.id), strUser);
        user.sid && await this.getSignaler().set(this.getShortChannel(user.sid), strUser);
        user.socketId && await this.getSignaler().set(this.getSocketChannel(user.socketId), strUser);
        return true;   
    }
    async redisDelUser(user:  ADHOCCAST.Dts.IUser): Promise<boolean> {
        user.id && await this.getSignaler().del(this.getUserChannel(user.id));
        user.sid && await this.getSignaler().del(this.getShortChannel(user.sid));
        user.socketId && await this.getSignaler().del(this.getSocketChannel(user.socketId));
        return true;   
    }    
    async redisAddRoomUser(roomid, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        let strUser =  JSON.stringify(user);    
        roomid && user && user.id && await this.getSignaler().hset(this.getRoomUsersChannel(roomid), user.id, strUser);    
        return true;  
    }  
    async redisDelRoomUser(roomid, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        roomid && user && user.id && await this.getSignaler().hdel(this.getRoomUsersChannel(roomid), user.id);    
        return true;  
    }    
    async redisAddRoom(room: ADHOCCAST.Dts.IRoom): Promise<boolean> {
        let strRoom =  JSON.stringify(room);
        room.id && await this.getSignaler().set(this.getRoomChannel(room.id), strRoom);
        return true;         
    }
    async redisDelRoom(room: ADHOCCAST.Dts.IRoom): Promise<boolean>  {
        room.id && await this.getSignaler().del(this.getRoomChannel(room.id));
        return true; 
    }
}