import { ERoomPrefix } from "../dts";

export function getAdhocRoomId(socket: SocketIO.Socket): string {
    return ERoomPrefix.adhoc + socket.conn.remoteAddress;
    // return ERoomPrefix.adhoc;
}
