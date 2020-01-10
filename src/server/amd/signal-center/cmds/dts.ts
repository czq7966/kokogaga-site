import * as Common from '../../common'

export enum ECommandId {
    //signal-center
    signal_center_deliver = "signal_center_deliver",
    signal_center_users_remove = "signal_center_users_remove",
    signal_center_users_update = "signal_center_users_update",
    signal_center_users_refresh = "signal_center_users_refresh",
}

export var DefaultPathName = "socket.io"

export interface ICommandDeliverDataExtraProps {
    path?: string
    includeSelf?: boolean
    namespace: string
}
export interface IDataUser {
    path?: string
    server?: string;
    namespace: string
    userId: string,
    shortId: string,
    socketId: string,
    rooms: {[id: string]: string}, //roomid:sim
}

export interface IDataUsers extends Common.CmdsCommon.Helper.IKeyValue<IDataUser>{
    groupByServer(): IDataServerUsers
    groupByRoomAndServer(): IDataRoomServerUsers
    getUsersByServer(serverId: string): IDataUsers
    getUsersByRoomAndServer(roomId: string, serverId: string): IDataUsers
}
export interface IDataSocketUsers extends Common.CmdsCommon.Helper.IKeyValue<IDataUser>{}
export interface IDataShortUsers  extends Common.CmdsCommon.Helper.IKeyValue<IDataUser>{}
export interface IDataRoomUsers extends Common.CmdsCommon.Helper.IKeyValue<IDataUsers>{
    addUser(user: IDataUser)
    delUser(user: IDataUser)
    groupByServer(roomId: string): IDataServerUsers
}
export interface IDataServerUsers extends Common.CmdsCommon.Helper.IKeyValue<IDataUsers>{}
export interface IDataRoomServerUsers extends Common.CmdsCommon.Helper.IKeyValue<IDataServerUsers>{}
export interface IDataNamespace {
    users: IDataUsers,          //Key: userId
    shortUsers: IDataShortUsers,     //Key: shortId
    socketUsers: IDataSocketUsers     //Key: socketId
    roomUsers: IDataRoomUsers       //Key: roomId
    // serverUsers: IDataServerUsers   //Key: serverId
    // roomServerUsers: IDataRoomServerUsers //Key: roomId->serverId
}
export interface IDataNamespaces extends Common.CmdsCommon.Helper.IKeyValue<IDataNamespace>{}
export interface IDataPath extends Common.CmdsCommon.Helper.IKeyValue<IDataNamespaces>{}
export interface IDataPaths extends Common.CmdsCommon.Helper.IKeyValue<IDataPath>{}

export interface IDataCenter {
    paths: IDataPaths
}

export interface ICommandUsersUpdateReqProps {
    [namespace: string]: IDataUser[]
}

export interface ICommandUsersRemoveReqProps extends ICommandUsersUpdateReqProps {}
export interface ICommandUsersRefreshReqProps extends ICommandUsersUpdateReqProps {}