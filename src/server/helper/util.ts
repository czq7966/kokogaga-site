import { ERoomPrefix } from "../dts";

export function getAdhocRoomId(socket: SocketIO.Socket): string {

    let id = socket.conn.remoteAddress;
    if (id.indexOf('::ffff:192') === 0 || id.indexOf('::ffff:172') === 0 ) 
        return ERoomPrefix.adhoc
    else 
        return ERoomPrefix.adhoc + socket.conn.remoteAddress;
}
