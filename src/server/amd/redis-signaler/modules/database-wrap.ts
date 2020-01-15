import * as Modules_Namespace from '../../../modules/namespace'
import * as Services from '../services'
import { ADHOCCAST } from '../libex'
import { IRedisSignaler } from './redis-signaler';
import { ISocketUser } from '../../../modules/user'
import { ISocketUsers } from '../../../modules/users'
import { IDatabase, IDataNamespace, IDataNamespaces } from '../../../modules/database';
import { DataNamespaceWrap } from './datanamespace-wrap';
import { IServer } from '../../../modules/server';

export interface IDatabaseWrap extends IDatabase {
    getSignaler(): IRedisSignaler
    getDatabase(): IDatabase    
}
export interface IDataNamespacesWrap extends IDataNamespaces {}
export class DatabaseWrap extends ADHOCCAST.Cmds.Common.Base implements IDatabaseWrap {
    signaler: IRedisSignaler
    database: IDatabase
    namespaces: IDataNamespacesWrap
    
    constructor(signaler: IRedisSignaler, database: IDatabase) {
        super();
        this.signaler = signaler;
        this.database = database;
        this.namespaces = new ADHOCCAST.Cmds.Common.Helper.KeyValue<IDataNamespace>();
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        this.namespaces.destroy();
        delete this.namespaces;
        super.destroy()
    }
    initEvents() {
        this.initServerEvents();
    }
    unInitEvents() {
        this.unInitServerEvents();
    }
    initServerEvents() {
        this.signaler.server.snsps.keys().forEach(key => {
            let snsp = this.signaler.server.snsps.get(key);
            this.initNamespaceEvents(snsp)
        })
    }
    initNamespaceEvents(snsp: Modules_Namespace.ISocketNamespace) {
        this.initUsersEvents(snsp.users);                
    }    
    unInitServerEvents() {
        this.signaler.server.snsps.keys().forEach(key => {
            let snsp = this.signaler.server.snsps.get(key);
            this.unInitNamespaceEvents(snsp)
        })
    }
    unInitNamespaceEvents(snsp: Modules_Namespace.ISocketNamespace) {
        this.unInitUsersEvents(snsp.users)        
    }        
    initUsersEvents(users: ISocketUsers) {
        if (users) {
            users.users.on('add', this.users_onUserAdd)
            users.users.on('del', this.users_onUserDel)
            users.shortUsers.on('add', this.users_onShortAdd)
            users.shortUsers.on('del', this.users_onShortDel)        
            users.sockets.on('add', this.users_onSocketAdd)
            users.sockets.on('del', this.users_onSocketDel)
            users.rooms.on('add', this.users_onRoomAdd)
            users.rooms.on('del', this.users_onRoomDel)    
        }
    }
    unInitUsersEvents(users: ISocketUsers) {
        if (users) {
            users.users.off('add', this.users_onUserAdd)
            users.users.off('del', this.users_onUserDel)
            users.shortUsers.off('add', this.users_onShortAdd)
            users.shortUsers.off('del', this.users_onShortDel)        
            users.sockets.off('add', this.users_onSocketAdd)
            users.sockets.off('del', this.users_onSocketDel)
            users.rooms.off('add', this.users_onRoomAdd)
            users.rooms.off('del', this.users_onRoomDel) 
        }
    }
    users_onUserAdd = (id: string, user: ISocketUser, kvUsers: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        Services.Modules.Database.users_onUserAdd(this, id, user, kvUsers);
    }
    users_onUserDel = (id: string, user: ISocketUser, kvUsers: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        Services.Modules.Database.users_onUserDel(this, id, user, kvUsers);
    }
    users_onShortAdd = (id: string, user: ISocketUser, kvShortUsers: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        Services.Modules.Database.users_onShortAdd(this, id, user, kvShortUsers);
    }
    users_onShortDel = (id: string, user: ISocketUser, kvShortUsers: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        Services.Modules.Database.users_onShortDel(this, id, user, kvShortUsers);
    }
    users_onSocketAdd = (id: string, user: ISocketUser, kvSockets: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        Services.Modules.Database.users_onSocketAdd(this, id, user, kvSockets);
    }
    users_onSocketDel = (id: string, user: ISocketUser, kvSockets: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        Services.Modules.Database.users_onSocketDel(this, id, user, kvSockets);
    }
    users_onRoomAdd = (id: string, room: ADHOCCAST.Dts.IRoom, kvRooms: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        Services.Modules.Database.users_onRoomAdd(this, id, room, kvRooms);
    }
    users_onRoomDel = (id: string, room: ADHOCCAST.Dts.IRoom, kvRooms: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        Services.Modules.Database.users_onRoomDel(this, id, room, kvRooms);
    }
    getSignaler(): IRedisSignaler {
        return this.signaler;
    }
    getDatabase(): IDatabase {
        return this.database;
    }     


    getPath(): string {
        return this.database.getPath()
    }
    getServer(): IServer {
        return this.database.getServer();
    }
    createNamespace(namespace: string): IDataNamespace {        
        let nspWrap = this.namespaces.get(namespace);
        if (!nspWrap) {
            let nsp = this.database.createNamespace(namespace);
            nspWrap = new DataNamespaceWrap(this, nsp);
            this.namespaces.add(namespace, nspWrap);
        }
        return nspWrap;
    }
    destroyNamespace(namespace: string) {
        let nspWrap = this.namespaces.get(namespace);
        nspWrap && nspWrap.destroy();
        this.database.destroyNamespace(namespace);
    }
    getNamespace(namespace: string): IDataNamespace {
        let nspWrap = this.namespaces.get(namespace); 
        if (!nspWrap) {
            let nsp = this.database.getNamespace(namespace);
            if (nsp)
                nspWrap = this.createNamespace(namespace)
        }
        return nspWrap;
    }
    
}