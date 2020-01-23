import { ADHOCCAST } from '../libex'
import { IDataNamespace, IDatabase, IDataUsers } from '../../../modules/database';
import { IDatabaseWrap } from './database-wrap';
import { IRedisSignaler } from './redis-signaler';

export interface IDataNamespaceWrap extends IDataNamespace {
    getSignaler(): IRedisSignaler
    getRoomChannel(id: string): string
    getRoomUsersChannel(id: string): string
    getUserChannel(id: string): string
    getShortChannel(id: string): string 
    getSocketChannel(id: string): string     
    getUserStreamRoomChannel(id: string, namespace?: string): string
    getUserStreamRoomUsersChannel(id: string, namespace?: string): string    
    syncData(): boolean
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
        let namespace = this.namespace;
        namespace.onNewUserShortID = this.newUserShortID.bind(this);
        namespace.onGetUser = this.getUser.bind(this);
        namespace.onExistUser = this.existUser.bind(this);
        namespace.onGetRoom = this.getRoom.bind(this);
        namespace.onExistRoom = this.existRoom.bind(this);
        namespace.getRoomUsersCount = this.getRoomUsersCount.bind(this);


        namespace.users.on('add', this.redis_onUserAdd)
        namespace.users.on('del', this.redis_onUserDel)
        namespace.shortUsers.on('add', this.redis_onShortUserAdd)
        namespace.shortUsers.on('del', this.redis_onShortUserDel)
        namespace.rooms.on('add', this.redis_onRoomAdd)
        namespace.rooms.on('del', this.redis_onRoomDel)                        
        namespace.roomUsers.on('add', this.redis_onRoomUsersAdd)
        namespace.roomUsers.on('del', this.redis_onRoomUsersDel)
        namespace.roomUsers.values().forEach(users => {
            users.on('add', this.redis_onRoomUserAdd)
            users.on('del', this.redis_onRoomUserDel)
        })    

        let sckNamespace = namespace.getDatabase().getServer().getNamespace(namespace.getName());
        sckNamespace.users.sockets.on('add', this.redis_onSocketConnect)
        sckNamespace.users.sockets.on('del', this.redis_onSocketDisconnect)
        

    }
    unInitEvents() {
        let namespace = this.namespace;
        namespace.onNewUserShortID = null;
        namespace.onGetUser = null;
        namespace.onExistUser = null;
        namespace.onGetRoom = null;
        namespace.onExistRoom = null;
        namespace.getRoomUsersCount = null;


        namespace.users.off('add', this.redis_onUserAdd)
        namespace.users.off('del', this.redis_onUserDel)
        namespace.shortUsers.off('add', this.redis_onShortUserAdd)
        namespace.shortUsers.off('del', this.redis_onShortUserDel)
        namespace.rooms.off('add', this.redis_onRoomAdd)
        namespace.rooms.off('del', this.redis_onRoomDel)                        
        namespace.roomUsers.off('add', this.redis_onRoomUsersAdd)
        namespace.roomUsers.off('del', this.redis_onRoomUsersDel)   
        namespace.roomUsers.values().forEach(users => {
            users.off('add', this.redis_onRoomUserAdd)
            users.off('del', this.redis_onRoomUserDel)
        })            

        let sckNamespace = namespace.getDatabase().getServer().getNamespace(namespace.getName());
        sckNamespace.users.sockets.off('add', this.redis_onSocketConnect)
        sckNamespace.users.sockets.off('del', this.redis_onSocketDisconnect)
    }

    getSignaler(): IRedisSignaler {return this.databasewrap.getSignaler();}
    getRoomChannel(id: string): string { return this.getSignaler().getNamespaceRoomChannel(id, this.getName()) }
    getRoomUsersChannel(id: string): string { return this.getSignaler().getNamespaceRoomUsersChannel(id, this.getName()) }
    getUserChannel(id: string): string { return this.getSignaler().getNamespaceUserChannel(id, this.getName()) }
    getShortChannel(id: string): string { return this.getSignaler().getNamespaceShortChannel(id, this.getName()) }
    getSocketChannel(id: string): string { return this.getSignaler().getNamespaceSocketChannel(id, this.getName()) }    
    getUserStreamRoomChannel(userid: string, roomid: string, namespace?: string): string { 
        return this.getSignaler().getNamespaceUserStreamRoomChannel(userid, roomid, this.getName()) 
    }   
    getUserStreamRoomUsersChannel(userid: string, roomid: string, namespace?: string): string  { 
        return this.getSignaler().getNamespaceUserStreamRoomUsersChannel(userid, roomid, this.getName()) 
    }     
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
    isReady(): boolean {
        return this.databasewrap.isReady()
    }

    //User
    async newUserShortID(len?: number): Promise<string> {
        len = len || 6;
        let sid = ADHOCCAST.Cmds.Common.Helper.uuid(len, 10)
        let existUser = await this.existUser({id: null, sid: sid});
        if (existUser) {
            return this.newUserShortID()
        } else {
            return sid
        }    
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
        return this.namespace.joinOrCreateRoom(roomid, user);   
    }
    async leaveOrCloseRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        return this.namespace.leaveOrCloseRoom(roomid, user);
    }    
    async getRoomUsersCount(roomid: string): Promise<number> {
        let channel = this.getRoomUsersChannel(roomid);
        return this.getSignaler().hlen(channel);
    }
    //Data Events
    redis_onSocketConnect = (id: string) => {
        let channel = this.getSocketChannel(id);
        this.getSignaler().subscribe(channel);       
    }
    redis_onSocketDisconnect = (id: string) => {
        let channel = this.getSocketChannel(id);
        this.getSignaler().unsubscribe(channel);
    }    
    redis_onUserAdd = (id: string, user: ADHOCCAST.Dts.IUser) => { 
        let channel = this.getUserChannel(id);
        let serverUsersChannel = this.getSignaler().getServerUsersChannel();
        let strUser = JSON.stringify(user);
        this.getSignaler().hset(serverUsersChannel, channel, strUser);
        this.getSignaler().set(channel, strUser);
        this.getSignaler().subscribe(channel);
        this.getSignaler().del(this.getUserStreamRoomChannel(id, user.room.id))
        this.getSignaler().del(this.getUserStreamRoomUsersChannel(id, user.room.id))
    }
    redis_onUserDel = (id: string, user: ADHOCCAST.Dts.IUser) => { 
        if (user) {
            let channel = this.getUserChannel(id);
            let serverUsersChannel = this.getSignaler().getServerUsersChannel();
            this.getSignaler().del(channel);
            this.getSignaler().hdel(serverUsersChannel, channel);
            this.getSignaler().unsubscribe(channel);
        }
    }
    redis_onShortUserAdd = (id: string, user: ADHOCCAST.Dts.IUser) => { 
        let channel = this.getShortChannel(id);
        let strUser = JSON.stringify(user);
        this.getSignaler().set(channel, strUser);
        this.getSignaler().subscribe(channel);
    }
    redis_onShortUserDel =(id: string, user: ADHOCCAST.Dts.IUser) => { 
        if (user) {
            let channel = this.getShortChannel(id);
            this.getSignaler().del(channel);
            this.getSignaler().unsubscribe(channel);
        }
    }      
    redis_onRoomAdd = (id: string, room: ADHOCCAST.Dts.IRoom) => { 
        let channel = this.getRoomChannel(id);
        let strRoom = JSON.stringify(room);
        this.getSignaler().set(channel, strRoom);
    }
    redis_onRoomDel =(id: string, room: ADHOCCAST.Dts.IRoom) => { 
        if (room) {
            let channel = this.getRoomChannel(id);
            this.getSignaler().del(channel);        
        }
    }
    redis_onRoomUsersAdd = (id: string, users: IDataUsers) => { 
        let channel = this.getRoomChannel(id);
        this.getSignaler().subscribe(channel);   
        users.on('add', this.redis_onRoomUserAdd)       
        users.on('del', this.redis_onRoomUserDel)
    }           
    redis_onRoomUsersDel = (id: string, users: IDataUsers) => { 
        if (users) {
            let channel = this.getRoomChannel(id);
            this.getSignaler().unsubscribe(channel);             
            users.off('add', this.redis_onRoomUserAdd)       
            users.off('del', this.redis_onRoomUserDel)       
        }
    }  
    redis_onRoomUserAdd = (id: string, user: ADHOCCAST.Dts.IUser, users: IDataUsers) => { 
        let room = users.extra as ADHOCCAST.Dts.IRoom;
        let roomUsersChannel = this.getRoomUsersChannel(room.id);
        let userChannel = this.getUserChannel(user.id);
        let strUser = JSON.stringify(user);
        this.getSignaler().hset(roomUsersChannel, userChannel, strUser);
    }
    redis_onRoomUserDel = (id: string, user: ADHOCCAST.Dts.IUser, users: IDataUsers) => { 
        if (user) {
            let room = users.extra as ADHOCCAST.Dts.IRoom;
            let roomUsersChannel = this.getRoomUsersChannel(room.id);
            let userChannel = this.getUserChannel(user.id);
            this.getSignaler().hdel(roomUsersChannel, userChannel);
        }
    }    
    redis_sync() {
        this.redis_sync_keyvalue(this.namespace.users);
        this.redis_sync_keyvalue(this.namespace.shortUsers);
        this.redis_sync_keyvalue(this.namespace.rooms);
        this.redis_sync_keyvalue(this.namespace.roomUsers);
        this.namespace.roomUsers.values().forEach(users => {
            this.redis_sync_keyvalue(users);
        })           
    }
    redis_sync_keyvalue(keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) {
        keyValue.keys().forEach(key => {
            let value = keyValue.get(key);
            keyValue.add(key, value);
        });
    }
    //Data sync
    syncData(): boolean {
        this.redis_sync();
        return true;
    }
}