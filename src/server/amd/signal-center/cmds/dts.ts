export enum ECommandId {
    //signal-center
    signal_center_deliver = "signal_center_deliver",
    signal_center_users_del = "signal_center_users_del",
    signal_center_users_add = "signal_center_users_add",
    signal_center_users_refresh = "signal_center_users_refresh",
}
export interface ICommandDeliverDataExtra {
    path?: string
    namesapce: string
}
export interface IUser {
    namespace: string
    userId: string,
    socketId: string,
    romms: {[id: string]: string},
    server: string;
}
export interface IUsers {
    [userId: string]: IUser
}
export interface ISocketUsers {
    [socketId: string]: IUser
}
export interface IRoomUsers {
    [roomId: string]: IUsers
}
export interface IServerUsers {
    [serverId: string]: IUsers
}
export interface IRoomServerUsers {
    [roomId: string]: IServerUsers
}
export interface INamespaceUsers {
    [namespace: string]: IUsers
}



export interface IDataCenter {
    paths: {
        [path: string]: {
            namespaces: {
                [namespace: string]: {
                    users: IUsers,
                    sockets: ISocketUsers,
                    rooms: IRoomUsers,
                    servers: IServerUsers,
                    roomServers: IRoomServerUsers
                }
            },
            servers: {
                [serverId: string]: INamespaceUsers
            },
            users: IUsers
        }
    }
}

export interface ICommandUsersReqProps {
    props: {[namespace: string]: IUser[]}

}

export interface ICommandUsersDelReqProps {

}