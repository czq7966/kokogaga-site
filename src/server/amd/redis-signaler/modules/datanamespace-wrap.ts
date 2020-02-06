import { ADHOCCAST } from '../libex'
import { IDataNamespace, IDatabase, IDataUsers } from '../../../modules/database';
import { IDatabaseWrap } from './database-wrap';
import { IRedisSignaler } from './redis-signaler';
import { Dts } from '../../../../../../adhoc-cast-connection/src/main/dts';

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
        namespace.onCreateRoom = this.createRoom.bind(this);
        namespace.onOpenRoom = this.openRoom.bind(this);
        namespace.onGetRoomUsersCount = this.getRoomUsersCount.bind(this);


        namespace.users.on('add', this.redis_onUserAdd)
        namespace.users.on('del', this.redis_onUserDel)
        namespace.shortUsers.on('add', this.redis_onShortUserAdd)
        namespace.shortUsers.on('del', this.redis_onShortUserDel)
        namespace.rooms.on('add', this.redis_onRoomAdd)
        // namespace.rooms.on('del', this.redis_onRoomDel)                        
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
        namespace.onCreateRoom = null;
        namespace.onOpenRoom = null;
        namespace.onGetRoomUsersCount = null;


        namespace.users.off('add', this.redis_onUserAdd)
        namespace.users.off('del', this.redis_onUserDel)
        namespace.shortUsers.off('add', this.redis_onShortUserAdd)
        namespace.shortUsers.off('del', this.redis_onShortUserDel)
        namespace.rooms.off('add', this.redis_onRoomAdd)
        // namespace.rooms.off('del', this.redis_onRoomDel)                        
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
        if (!this.isReady()) return this.namespace.newUserShortID(len, true);
        //
        len = len || 6;
        let sid = ADHOCCAST.Cmds.Common.Helper.uuid(len, 10)
        let script = 
            `if (redis.call('get', KEYS[1]) == false) then
                redis.call('set', KEYS[1], KEYS[2])
                redis.call('expire', KEYS[1], 10)
                return  KEYS[1]
            end`;
        let user: Dts.IUser = {
            id: ADHOCCAST.Cmds.Common.Helper.uuid(),
            sid: sid,
            serverId: this.getSignaler().server.getId()
        }
        let userStr = JSON.stringify(user);

        let shortChannel = this.getShortChannel(user.sid);
        let result = await this.getSignaler().pubmultiAsync([
            ['eval', script, 2, shortChannel, userStr]
        ])
        if (result && result[0] == shortChannel) {
            return sid
        } else {
            return this.newUserShortID()
        }
    }
    async getUser(user: ADHOCCAST.Dts.IUser): Promise<ADHOCCAST.Dts.IUser> {
        if (!this.isReady()) return this.namespace.getUser(user, true);
        //
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
        if (!this.isReady()) return this.namespace.existUser(user, true);
        //
        let exist = await this.getUser(user);
        return !!exist;   
    }
    async addUser(user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        if (!this.isReady()) return this.namespace.addUser(user, true);
        //
        return this.namespace.addUser(user);
    }
    async delUser(user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        if (!this.isReady()) return this.namespace.delUser(user, true);
        //
        return this.namespace.delUser(user); 
    }
    //Room
    async getRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        if (!this.isReady()) return this.namespace.getRoom(roomid, true);
        //
        let nspRoom: ADHOCCAST.Dts.IRoom;
        let channel = this.getRoomChannel(roomid)
        let strRoom = await this.getSignaler().get(channel);
        if (strRoom) 
            nspRoom = JSON.parse(strRoom);
        return nspRoom; 
    }
    async existRoom(roomid: string): Promise<boolean> {
        if (!this.isReady()) return this.namespace.existRoom(roomid, true);
        //
        let uroom = await this.getRoom(roomid);
        return !!uroom;        
    }
    async createRoom(roomid: string, room?: Dts.IRoom): Promise<ADHOCCAST.Dts.IRoom> {
        if (!this.isReady()) return this.namespace.createRoom(roomid, room, true);
        //
        let script = 
            `if (redis.call('get', KEYS[1]) == false) then
                redis.call('set', KEYS[1], KEYS[2])
                redis.call('expire', KEYS[1], 10)
                return  KEYS[2]
            else 
                return redis.call('get', KEYS[1])
            end`;
        room = room || {
            id: roomid,
            sim: ADHOCCAST.Cmds.Common.Helper.uuid()
        }
        let roomStr = JSON.stringify(room);
        let roomChannel = this.getRoomChannel(room.id);
        let result = await this.getSignaler().pubmultiAsync([
            ['eval', script, 2, roomChannel, roomStr]
        ])
        if (result) roomStr = result[0];

        let uroom = JSON.parse(roomStr);
        if (room.sim == uroom.sim) {
            this.namespace.rooms.add(room.id, room);
            return room;
        } else {
            return uroom;
        }
    }
    async openRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        if (!this.isReady()) return this.namespace.openRoom(roomid, true);
        //
        let room: Dts.IRoom = {
            id: roomid,
            sim: ADHOCCAST.Cmds.Common.Helper.uuid()
        }
        let uroom = await this.createRoom(roomid, room);
        if (room.sim == uroom.sim) {
            return room
        } else {
            throw 'Room already exist!'
        } 
    }
    async closeRoom(roomid: string): Promise<ADHOCCAST.Dts.IRoom> {
        if (!this.isReady()) return this.namespace.closeRoom(roomid, true);
        //
        let room = await this.namespace.closeRoom(roomid);
        room && this.redis_onRoomDel(roomid, room);
        return room;
    }
    changeRoomId(roomOldId: string, roomNewId: string): Promise<boolean> {
        if (!this.isReady()) return this.namespace.changeRoomId(roomOldId, roomNewId, true);
        //
        return this.namespace.changeRoomId(roomOldId, roomNewId);
    }
    //Room Users 
    async joinRoom(roomid: string, user: ADHOCCAST.Dts.IUser):  Promise<boolean>  {
        if (!this.isReady()) return this.namespace.joinRoom(roomid, user, true);
        //
        return this.namespace.joinRoom(roomid, user);
    }
    async leaveRoom(roomid: string, user: ADHOCCAST.Dts.IUser, closeWhileNoUser: boolean): Promise<boolean> {
        if (!this.isReady()) return this.namespace.leaveRoom(roomid, user, closeWhileNoUser, true);
        //
        return this.namespace.leaveRoom(roomid, user, closeWhileNoUser);
    }
    async joinOrCreateRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        if (!this.isReady()) return this.namespace.joinOrCreateRoom(roomid, user, true);
        //
        await this.createRoom(roomid);
        return await this.joinRoom(roomid, user);    
    }
    async leaveOrCloseRoom(roomid: string, user: ADHOCCAST.Dts.IUser): Promise<boolean> {
        if (!this.isReady()) return this.namespace.leaveOrCloseRoom(roomid, user, true);
        //
        return await this.leaveRoom(roomid, user, true);
    }    
    async getRoomUsersCount(roomid: string): Promise<number> {
        if (!this.isReady()) return this.namespace.getRoomUsersCount(roomid, true);
        //
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
        let userChannel = this.getUserChannel(id);
        let shortChannel = this.getShortChannel(user.sid);
        let userStreamRoomChannel = this.getUserStreamRoomChannel(id, user.room.id);
        let userStreamRoomUsersChannel = this.getUserStreamRoomUsersChannel(id, user.room.id);
        let roomUsersChannel = this.getRoomUsersChannel(user.room.id);
        let serverUsersChannel = this.getSignaler().getServerUsersChannel();
        let strUser = JSON.stringify(user);

        let pubmulti = this.getSignaler().pubmulti();
        pubmulti && pubmulti
        .hset(serverUsersChannel, userChannel, strUser)
        .set(userChannel, strUser)
        .set(shortChannel, strUser)
        .persist(shortChannel)
        .hset(roomUsersChannel, userChannel, strUser)
        .del(userStreamRoomChannel)
        .del(userStreamRoomUsersChannel)
        .exec();

        let submulti = this.getSignaler().submulti();
        submulti && submulti
        .subscribe(userChannel)
        .subscribe(shortChannel)
        .exec();
    }
    redis_onUserDel = (id: string, user: ADHOCCAST.Dts.IUser) => { 
         if (user) {
            let userChannel = this.getUserChannel(id);
            let shortChannel = this.getShortChannel(user.sid);
            let userStreamRoomChannel = this.getUserStreamRoomChannel(id, user.room.id);
            let userStreamRoomUsersChannel = this.getUserStreamRoomUsersChannel(id, user.room.id);
            let roomUsersChannel = this.getRoomUsersChannel(user.room.id);
            let serverUsersChannel = this.getSignaler().getServerUsersChannel();

            let pubmulti = this.getSignaler().pubmulti();
            pubmulti && pubmulti
            .del(userStreamRoomChannel)
            .del(userStreamRoomUsersChannel)
            .hdel(roomUsersChannel, userChannel)
            .del(userChannel)
            .del(shortChannel)
            .hdel(serverUsersChannel, userChannel)     
            .exec();

            let submulti = this.getSignaler().submulti();
            submulti && submulti
            .unsubscribe(userChannel)
            .unsubscribe(shortChannel)
            .exec();
        }
    }
    redis_onShortUserAdd = (id: string, user: ADHOCCAST.Dts.IUser) => { 
        // let channel = this.getShortChannel(id);
        // let strUser = JSON.stringify(user);
        // this.getSignaler().set(channel, strUser);
        // this.getSignaler().subscribe(channel);
    }
    redis_onShortUserDel =(id: string, user: ADHOCCAST.Dts.IUser) => { 
        // if (user) {
            // let channel = this.getShortChannel(id);
            // this.getSignaler().del(channel);
            // this.getSignaler().unsubscribe(channel);
        // }
    }      
    redis_onRoomAdd = (id: string, room: ADHOCCAST.Dts.IRoom) => { 
        let roomChannel = this.getRoomChannel(id);
        let strRoom = JSON.stringify(room);
        this.getSignaler().pubmulti()
        .set(roomChannel, strRoom)
        .persist(roomChannel)
        .exec();
    }
    redis_onRoomDel =(id: string, room: ADHOCCAST.Dts.IRoom) => { 
        if (room) {
            let roomChannel = this.getRoomChannel(id);
            let roomUsersChannel = this.getRoomUsersChannel(id);
            this.getSignaler().pubmulti()
            .del(roomChannel)
            .del(roomUsersChannel)
            .exec()        
        }
    }
    redis_onRoomUsersAdd = (id: string, users: IDataUsers) => { 
        let roomChannel = this.getRoomChannel(id);
        this.getSignaler().subscribe(roomChannel);   
        users.on('add', this.redis_onRoomUserAdd)       
        users.on('del', this.redis_onRoomUserDel)
    }           
    redis_onRoomUsersDel = (id: string, users: IDataUsers) => { 
        if (users) {
            let roomChannel = this.getRoomChannel(id);
            this.getSignaler().unsubscribe(roomChannel);             
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
        let script = 
        `if (redis.call('hlen', KEYS[1]) == 0) then 
            redis.call('del', KEYS[2]) 
        end`;

        let room = users.extra as ADHOCCAST.Dts.IRoom;
        let userChannel = this.getUserChannel(id);
        let roomChannel = this.getRoomChannel(room.id);
        let roomUsersChannel = this.getRoomUsersChannel(room.id);
        
        let pubmulti = this.getSignaler().pubmulti();
        pubmulti && pubmulti
        .hdel(roomUsersChannel, userChannel)
        .eval(script, 2, roomUsersChannel, roomChannel)
        .exec();
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