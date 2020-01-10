import * as Modules_Namespace from '../../../modules/namespace'
import { ADHOCCAST } from '../libex'
import { IRedisSignaler } from './redis-signaler';
import { ISocketUser } from '../../../modules/user'
import { ISocketUsers } from '../../../modules/users'

export interface IDatabase extends ADHOCCAST.Cmds.Common.IBase {
    signaler: IRedisSignaler
}
export class Database extends ADHOCCAST.Cmds.Common.Base implements IDatabase {
    signaler: IRedisSignaler
    constructor(signaler: IRedisSignaler) {
        super();
        this.signaler = signaler;
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
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
    users_onUserAdd = (id: string, user: ISocketUser, keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        let users = keyValue.extra as ISocketUsers;        
        this.signaler.subscribe(this.signaler.getUserChannel(id, users.snsp.options.name)) 
    }
    users_onUserDel = (id: string, user: ISocketUser, keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        let users = keyValue.extra as ISocketUsers;
        this.signaler.unsubscribe(this.signaler.getUserChannel(id, users.snsp.options.name)) 
    }
    users_onShortAdd = (id: string, user: ISocketUser, keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        let users = keyValue.extra as ISocketUsers;
        this.signaler.subscribe(this.signaler.getShortChannel(id, users.snsp.options.name)) 
    }
    users_onShortDel = (id: string, user: ISocketUser, keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        let users = keyValue.extra as ISocketUsers;
        this.signaler.unsubscribe(this.signaler.getShortChannel(id, users.snsp.options.name)) 
    }
    users_onSocketAdd = (id: string, user: ISocketUser, keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        let users = keyValue.extra as ISocketUsers;
        this.signaler.subscribe(this.signaler.getSocketChannel(id, users.snsp.options.name)) 
    }
    users_onSocketDel = (id: string, user: ISocketUser, keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        let users = keyValue.extra as ISocketUsers;
        this.signaler.unsubscribe(this.signaler.getSocketChannel(id, users.snsp.options.name)) 
    }
    users_onRoomAdd = (id: string, room: ADHOCCAST.Dts.IRoom, keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        let users = keyValue.extra as ISocketUsers;
        this.signaler.subscribe(this.signaler.getRoomChannel(id, users.snsp.options.name)) 
    }
    users_onRoomDel = (id: string, room: ADHOCCAST.Dts.IRoom, keyValue: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
        let users = keyValue.extra as ISocketUsers;
        this.signaler.unsubscribe(this.signaler.getRoomChannel(id, users.snsp.options.name)) 
    }

}