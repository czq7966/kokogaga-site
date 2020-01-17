import { ADHOCCAST } from '../libex'
import { IDataNamespace, IDatabase } from '../../../modules/database';
import { IDatabaseWrap } from './database-wrap';
import { IRedisSignaler } from './redis-signaler';

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
        this.namespace = namespace;
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        delete this.databasewrap;
        delete this.namespace;
    }
    initEvents() {
        // let namespace = this.namespace;
        // namespace.users.on('add', this.redis_onUserAdd)
        // namespace.users.on('del', this.redis_onUserDel)
        // namespace.shortUsers.on('add', this.redis_onShortUserAdd)
        // namespace.shortUsers.on('del', this.redis_onShortUserDel)
        // namespace.rooms.on('add', this.redis_onRoomAdd)
        // namespace.rooms.on('del', this.redis_onRoomDel)                        
        // namespace.roomUsers.on('add', this.redis_onRoomUsersAdd)
        // namespace.roomUsers.on('del', this.redis_onRoomUsersDel)    
        

    }
    unInitEvents() {

    }

    getSignaler(): IRedisSignaler {return this.databasewrap.getSignaler();}
    getRoomChannel(id: string): string { return this.getSignaler().getNamespaceRoomChannel(id, this.getName()) }
    getRoomUsersChannel(id: string): string { return this.getSignaler().getNamespaceRoomUsersChannel(id, this.getName()) }
    getUserChannel(id: string): string { return this.getSignaler().getNamespaceUserChannel(id, this.getName()) }
    getShortChannel(id: string): string { return this.getSignaler().getNamespaceShortChannel(id, this.getName()) }
    getSocketChannel(id: string): string { return this.getSignaler().getNamespaceSocketChannel(id, this.getName()) }    
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
        return this.namespace.addUser(user);
    }
    async delUser(user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        return this.namespace.delUser(user); 
    }
    //Room
    async getRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        let nspRoom: ADHOCCAST.Dts.IRoom;
        let channel = this.getRoomChannel(roomid)
        let strRoom = await this.getSignaler().get(channel);
        if (strRoom) 
            nspRoom = JSON.parse(strRoom);
        return nspRoom; 
    }
    async existRoom(roomid: string): Promise<boolean> {
        let uroom = await this.getRoom(roomid);
        return !!uroom;        
    }
    async createRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        return this.namespace.createRoom(roomid);
    }
    async openRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        return this.namespace.openRoom(roomid);
    }
    async closeRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        return this.namespace.closeRoom(roomid);
    }
    changeRoomId(roomOldId: string, roomNewId: string): Promise<boolean> {
        return this.namespace.changeRoomId(roomOldId, roomNewId);
    }
    //Room Users 
    async joinRoom(roomid: string, user: ADHOCCAST.Dts.IUser):  Promise<boolean>  {
        return this.namespace.joinRoom(roomid, user);

    }
    async leaveRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        return this.namespace.leaveRoom(roomid, user);
    }
    async joinOrCreateRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        return this.joinOrCreateRoom(roomid, user);   
    }
    async leaveOrCloseRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        return this.leaveOrCloseRoom(roomid, user);
    }    
    async getRoomUsersCount(roomid: string): Promise<number> {
        return this.getSignaler().hlen(this.getRoomUsersChannel(roomid))
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