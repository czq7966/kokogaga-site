import * as Cmds from '../cmds'
import * as Common from '../../common'


export class DataUsers extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataUser> implements Cmds.IDataUsers{
    groupByServer(): Cmds.IDataServerUsers {
        let servers = new DataServerUsers();
        this.keys().forEach(key => {
            let user = this.get(key);
            let users = servers.get(user.server);
            if (!users) {
                users = new DataUsers();
                servers.add(user.server, users)
            }
            users.add(user.userId, user);            
        })
        return servers;
    }
    groupByRoomAndServer(): Cmds.IDataRoomServerUsers {
        let roomServerUsers = new DataRoomServerUsers();        
        this.keys().forEach(userId => {
            let user = this.get(userId);   
            Object.keys(user.rooms).forEach(uroomId => {
                let roomServer = roomServerUsers.get(uroomId);
                if (!roomServer) {
                    roomServer = new DataServerUsers();
                    roomServerUsers.add(uroomId, roomServer);
                }
                let serverUsers = roomServer.get(user.server);
                if (!serverUsers) {
                    serverUsers = new DataUsers();
                    roomServer.add(user.server, serverUsers);
                }
                serverUsers.add(userId, user);
            })         
        })
        return roomServerUsers;
    }
    getUsersByServer(serverId: string): Cmds.IDataUsers {
        let servers = this.groupByServer();
        let users = servers.get(serverId);
        return users || new DataUsers();
    }
    getUsersByRoomAndServer(roomId: string, serverId: string): Cmds.IDataUsers {
        let roomServers = this.groupByRoomAndServer();
        let servers = roomServers.get(roomId) || new DataServerUsers();
        let users = servers.get(serverId);
        return users || new DataUsers();
    }
}
export class DataShortUsers extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataUser> implements Cmds.IDataShortUsers{}
export class DataSocketUsers extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataUser> implements Cmds.IDataSocketUsers{}
export class DataRoomUsers extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataUsers> implements Cmds.IDataRoomUsers{
    addUser(user: Cmds.IDataUser) {
        Object.keys(user.rooms || {}).forEach(roomId => {
            let users = this.get(roomId);
            if (!users) {
                users = new DataUsers();
                this.add(roomId, users)
            }
            users.add(user.userId, user);
        })
    }
    delUser(user: Cmds.IDataUser) {
        Object.keys(user.rooms || {}).forEach(roomId => {
            let users = this.get(roomId);            
            users && users.del(user.userId);
            users && users.count() <=0 && this.del(roomId);
        })  
    }
    groupByServer(roomId: string): Cmds.IDataServerUsers {
        let roomUsers = this.get(roomId);  
        if (roomUsers)
            return roomUsers.groupByServer()
        else 
            return new DataServerUsers();
    }    
}
export class DataServerUsers extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataUsers> implements Cmds.IDataServerUsers{}
export class DataRoomServerUsers extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataServerUsers> implements Cmds.IDataRoomServerUsers{}
export class DataNamespace implements Cmds.IDataNamespace {
    users: Cmds.IDataUsers          //Key: userId
    shortUsers: Cmds.IDataShortUsers     //Key: shortId
    socketUsers: Cmds.IDataSocketUsers     //Key: socketId
    roomUsers: Cmds.IDataRoomUsers       //Key: roomId
    constructor() {
        this.users = new DataUsers();
        this.shortUsers = new DataShortUsers();
        this.socketUsers = new DataSocketUsers();
        this.roomUsers = new DataRoomUsers();
    }

    removeUser(user: Cmds.IDataUser) {
        this.users.del(user.userId);
        this.shortUsers.del(user.shortId);
        this.socketUsers.del(user.socketId);
        this.roomUsers.delUser(user);
    }

    updateUser(user: Cmds.IDataUser) {
        this.removeUser(user);
        this.users.add(user.userId, user);
        this.shortUsers.add(user.shortId, user);
        this.socketUsers.add(user.socketId, user);
        this.roomUsers.addUser(user);
    }
}

export class DataNamespaces extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataNamespace> implements Cmds.IDataNamespaces{}
export class DataPath extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataNamespaces> implements Cmds.IDataPath{}
export class DataPaths extends Common.CmdsCommon.Helper.KeyValue<Cmds.IDataPath> implements Cmds.IDataPaths{}
export class DataCenter implements Cmds.IDataCenter {
    paths: Cmds.IDataPaths
    constructor() {
        this.paths = new DataPaths();
    }
}


export interface IDatabase {
    data: Cmds.IDataCenter;
}

export class Database {
    data: Cmds.IDataCenter;
    constructor() {
        this.init();
    }
    destroy() {
        this.uninit();
    }
    init() {
        this.data = new DataCenter();
        this.data.paths.add(Cmds.DefaultPathName, new DataPath());
    }
    uninit() {

    }

}