export enum EReservedEvents {
    error = 'error',
    connect = 'connect',
    disconnect = 'disconnect',
    disconnecting = 'disconnecting',
    // newListener = 'newListener',
    removeListener = 'removeListener',
    ping = 'ping',
    pong = 'pong',
}

export enum ECustomEvents {
    message = 'message',
    openRoom = 'open-room',
    closeRoom = 'close-room',
    joinRoom = 'join-room',
    leaveRoom = 'leave-room',
}

export interface IUserQuery {
    roomid?: string,
    password?: string,
    isOwner?: boolean,
    from?: string,
    to?: string,
    msg?: any
}

export interface IUserSocket extends SocketIO.Socket {
    user?: SocketUser
}


export class SocketUser  {
    io: SocketIO.Server;
    query: IUserQuery;
    socket: IUserSocket;
    constructor(io: SocketIO.Server, socket: IUserSocket) {
        this.io = io;
        this.query = {};
        this.onConnect(socket);      
    }

    destroy() {
        this.unInitEvents();
        delete this.query;
        delete this.io;
        delete this.socket;
    }

    initEvents() {
        this.socket.on(EReservedEvents.error, this.onError);
        this.socket.on(EReservedEvents.disconnecting, this.onDisconnecting);
        this.socket.on(EReservedEvents.disconnect, this.onDisconnect);

        this.socket.on(ECustomEvents.message, this.onMessage);
        this.socket.on(ECustomEvents.openRoom, this.onOpenRoom);
        this.socket.on(ECustomEvents.closeRoom, this.onCloseRoom);
        this.socket.on(ECustomEvents.joinRoom, this.onJoinRoom);
        this.socket.on(ECustomEvents.leaveRoom, this.onLeaveRoom);

        [EReservedEvents, ECustomEvents].forEach(events => {
            Object.keys(events).forEach(key => {
                let value = events[key];
                let _this = this;
                this.socket.addListener(value, function() {
                    console.log('ServerEvent', value, arguments)
                })
            })
        })
    }
    unInitEvents() {
        this.socket.removeAllListeners();        
    }

    onConnect = (socket: IUserSocket) => {
        console.log('ServerEvent', 'onConnect', socket.id)
        this.socket = socket;
        this.socket.user = this;
        this.initEvents();  
    }


    onError = (err) => {
        console.error(err)
    }


    onDisconnecting = () => {
        if (this.query.roomid) {
            if (this.query.isOwner) {
                this.onCloseRoom(this.query);
            } else {
                this.onLeaveRoom(this.query);
            }
        }
    }

    onDisconnect = () => {
        this.unInitEvents();
    }    

    /////////////////////////////////////
    onMessage = (query: IUserQuery, callback?: (result: boolean, msg?: string) => void) => {
        let roomid = query.to || query.roomid;
        let room = this.socket.adapter.rooms[roomid];
        if (room) {
            query.from = query.from || this.socket.id;            
            this.socket.to(query.to).emit(ECustomEvents.message, query);   
            callback && callback(true);
        } else {
            callback && callback(false, 'room not exists: ' + roomid);
        }
    }
    onOpenRoom = (query: IUserQuery, callback?: (result: boolean, msg?: string) => void) => {
        let room = this.socket.adapter.rooms[query.roomid];
        if (room) {
            callback && callback(false, 'room exists: ' + query.roomid);
        } else {
            this.socket.join(query.roomid);
            this.query = Object.assign({}, query);
            this.query.isOwner = true;
            this.socket.user = this;
            callback && callback(true);
        }
    }
    onCloseRoom = (query: IUserQuery, callback?: (result: boolean, msg?: string) => void) => {
        let room = this.socket.adapter.rooms[query.roomid];
        if (room) {
            query.from = query.from || this.socket.id;
            this.socket.to(query.roomid).emit(ECustomEvents.closeRoom, query);            
            Object.keys(room.sockets).forEach(sid => {
                let socket = this.socket.nsp.sockets[sid];
                socket && socket.leave(query.roomid);
            })
        }
        room = this.socket.adapter.rooms[query.roomid];
        if(room) {
            callback && callback(false, 'close failed: ' + query.roomid + ', length ' + room.length);
        } else {
            callback && callback(true);
        }
    }
    onJoinRoom = (query: IUserQuery, callback?: (result: boolean, msg?: string) => void) => {
        let room = this.socket.adapter.rooms[query.roomid];
        if (room) {
            query.from = query.from || this.socket.id;
            this.socket.join(query.roomid);
            this.query = Object.assign(query);
            this.socket.to(query.roomid).emit(ECustomEvents.joinRoom, query);
            callback && callback(true);
        } else  {
            callback && callback(false, 'room not exist: ' + query.roomid);
        }
    }
    onLeaveRoom = (query: IUserQuery, callback?: (result: boolean, msg?: string) => void) => {      
        if (this.query.isOwner) {
            this.onCloseRoom(query, callback)
        } else {
            let room = this.socket.rooms[query.roomid];
            if (room) {
                query.from = query.from || this.socket.id;
                this.socket.to(query.roomid).emit(ECustomEvents.leaveRoom, query);
                this.socket.leave(query.roomid);            
            } 
            callback && callback(true);        
        }
    }
}