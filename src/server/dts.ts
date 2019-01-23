
export * from './cmds/dts'


export enum EServerSocketEvents {
    error = 'error',
    connect = 'connect',
    disconnect = 'disconnect',
    disconnecting = 'disconnecting',
    // newListener = 'newListener',
    // removeListener = 'removeListener',
    ping = 'ping',
    pong = 'pong',  
}



