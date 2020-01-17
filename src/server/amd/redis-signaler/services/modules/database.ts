
import * as Modules from '../../modules'
import { ADHOCCAST } from '../../libex'
import { ISocketUser } from '../../../../modules/user'
import { ISocketUsers } from '../../../../modules/users'



export class Database {
    // static users_onUserAdd(database: Modules.IDatabase, id: string, user: ISocketUser, kvUsers: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) { 
    //     let users = kvUsers.extra as ISocketUsers;        
    //     database.signaler.subscribe(database.signaler.getUserChannel(id, users.snsp.options.name)) 
    // }
    // static users_onUserDel = (database: Modules.IDatabase, id: string, user: ISocketUser, kvUsers: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
    //     let users = kvUsers.extra as ISocketUsers;
    //     database.signaler.unsubscribe(database.signaler.getUserChannel(id, users.snsp.options.name)) 
    // }
    // static users_onShortAdd = (database: Modules.IDatabase, id: string, user: ISocketUser, kvShortUsers: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
    //     let users = kvShortUsers.extra as ISocketUsers;
    //     database.signaler.subscribe(database.signaler.getShortChannel(id, users.snsp.options.name)) 
    // }
    // static users_onShortDel = (database: Modules.IDatabase, id: string, user: ISocketUser, kvShortUsers: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
    //     let users = kvShortUsers.extra as ISocketUsers;
    //     database.signaler.unsubscribe(database.signaler.getShortChannel(id, users.snsp.options.name)) 
    // }
    // static users_onSocketAdd = (database: Modules.IDatabase, id: string, user: ISocketUser, kvSockets: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
    //     let users = kvSockets.extra as ISocketUsers;
    //     database.signaler.subscribe(database.signaler.getSocketChannel(id, users.snsp.options.name)) 
    // }
    // static users_onSocketDel = (database: Modules.IDatabase, id: string, user: ISocketUser, kvSockets: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
    //     let users = kvSockets.extra as ISocketUsers;
    //     database.signaler.unsubscribe(database.signaler.getSocketChannel(id, users.snsp.options.name)) 
    // }
    // static users_onRoomAdd = (database: Modules.IDatabase, id: string, room: ADHOCCAST.Dts.IRoom, kvRooms: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
    //     let users = kvRooms.extra as ISocketUsers;
    //     database.signaler.subscribe(database.signaler.getRoomChannel(id, users.snsp.options.name)) 
    // }
    // static users_onRoomDel = (database: Modules.IDatabase, id: string, room: ADHOCCAST.Dts.IRoom, kvRooms: ADHOCCAST.Cmds.Common.Helper.IKeyValue<any>) => { 
    //     let users = kvRooms.extra as ISocketUsers;
    //     database.signaler.unsubscribe(database.signaler.getRoomChannel(id, users.snsp.options.name)) 
    // }   
}