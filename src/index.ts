interface IRoom {
    id: string,
    caller: IClient,
    callee?: IClient
}
interface IRooms  {
    [id: string]: IRoom
}
interface IClient extends SocketIO.Socket {
    roomid?: string,
    isCaller?: boolean
}

enum EEvents {
    connect = 'connection',
    disconnect = 'disconnect',
    message = 'message',
    openRoom = 'open-room',
    closeRoom = 'close-room',
    joinRoom = 'join-room',
    leaveRoom = 'leave-room',
    openOrJoinRoom = 'open-or-join-room'
}

var io = require('socket.io')() as SocketIO.Server;
var rooms: IRooms = {};

io.on(EEvents.connect, (client: SocketIO.Socket) => {
    var currClient: IClient = client;   
    console.log('on connection', client.id);

    var disconnect = (reason) => {
        if (!currClient) return;

        if (currClient.isCaller) {
            console.log('disconnect', 'delete room: ' + currClient.roomid)
            delete rooms[currClient.roomid]
        } else {
            if (currClient.roomid && rooms[currClient.roomid]) {
                console.log('disconnect', 'callee exit room: ' + currClient.roomid)
                rooms[currClient.roomid].callee = null;
            }
        }
        client.broadcast.emit(EEvents.leaveRoom, client.id);
        currClient = null;
    }

    var openRoom =  (roomid: string, callback?: Function) => {
        var room = rooms[roomid];
        if (room) {
            console.log('room exist: ' + roomid)
            if (callback) callback(false)
        } else {
            rooms[roomid] = {
                id: roomid,
                caller: currClient
            };
            currClient.roomid = roomid;
            currClient.isCaller = true;
            client.broadcast.emit(EEvents.openRoom, roomid);
            console.log('open room success:' + roomid)
            if (callback) callback(true)
        }
    }
    var joinRoom = (roomid: string, callback?: Function) => {
        var room = rooms[roomid];
        if (room && !room.callee) {
            console.log('callee join room: ' + roomid)
            currClient.roomid = roomid;
            room.callee = currClient;
            if (callback) callback(true);
            client.broadcast.emit(EEvents.joinRoom, client.id)
        } else {
            console.log('callee has exist in room : ' + roomid)
            if (callback) callback(false);
        }
        
    }
    var openOrJoinRoom = (roomid: string, callback?: Function) => {
        console.log('openOrJoin room: ' + roomid)
        if (!rooms[roomid]) {
            console.log('open room: ' + roomid)
            openRoom(roomid, callback)
        } else {
            console.log('join room: ' + roomid)
            joinRoom(roomid, callback)
        }
    }
    var message = (data: any, callback?: Function) => {
        console.log('message', data)
        client.broadcast.emit(EEvents.message, data);
        if (callback)  callback();
    }

    client.on(EEvents.disconnect, disconnect)
    client.on(EEvents.openRoom, openRoom)
    client.on(EEvents.joinRoom, joinRoom)
    client.on(EEvents.openOrJoinRoom, openOrJoinRoom)
    client.on(EEvents.message, message)
})

var port = 3000;
console.log('lisent on port ' + port)
io.listen(port)

