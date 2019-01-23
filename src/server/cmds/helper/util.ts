import { ERoomPrefix } from "../dts";

export function getAdhocRoomId(socket: SocketIO.Socket): string {
    return ERoomPrefix.adhoc + '/' + socket.conn.remoteAddress;
}
export function joinAdhocRoom(socket: SocketIO.Socket): SocketIO.Socket  {
    let roomid = getAdhocRoomId(socket);
    return socket.to(roomid)

}