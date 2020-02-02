export * from '../signal-center/cmds/dts'

export enum ChannelKeys {
    Path = '/path:',
    Servers = '/servers:',
    Server = '/server:',
    Namespace = '/namespace:',
    Users = '/users:',
    Room = '/room:',
    User = '/user:',
    Short = '/short:',
    Socket = '/socket:',
    Exist = '/exist:',
    UserStreamRoomPrefix = '/stream#'
}
export interface IOptionsExtra {
    redundanceScript?: string
}
export interface IKeyspaceEvents {
    pattern: string,
    channel: string,
    message: string
}