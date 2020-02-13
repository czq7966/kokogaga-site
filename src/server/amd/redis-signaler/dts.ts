import { RedisOptions, ClusterOptions, Redis } from 'ioredis';

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
    UserStreamRoomPrefix = '/stream#',
    Keyspace = '__keyspace@*__:'
}
export interface IOptionsExtra {
    enabled?: boolean,
    url?: string,
    handshakeInterval?: number,
    handshakeTimeout?:  number,
    redundanceScript?: string,
    nodes?:RedisOptions[]
    options?: RedisOptions | ClusterOptions
}
export interface IKeyspaceEvents {
    pattern: string,
    channel: string,
    message: string
}
export interface IRedisNode {
    node: Redis,
    type: 'pub' | 'sub',
}