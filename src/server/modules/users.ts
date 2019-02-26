import { SocketUser, ISocketUser } from "./user";
import * as Dts from "../dts";
import * as Cmds from "../cmds/index";

export interface ISocketNamespace extends SocketIO.Namespace {
    users?: SocketUsers
}

export interface ISocketUsers extends Cmds.Common.IBase {
    nsp: ISocketNamespace
    users: Cmds.Common.Helper.KeyValue<ISocketUser>;
    sockets: Cmds.Common.Helper.KeyValue<ISocketUser>;
    shortUsers: Cmds.Common.Helper.KeyValue<ISocketUser>;
    rooms:  Cmds.Common.Helper.KeyValue<Dts.IRoom>;
}

export class SocketUsers extends Cmds.Common.Base implements ISocketUsers {
    nsp: ISocketNamespace
    users: Cmds.Common.Helper.KeyValue<ISocketUser>;
    sockets: Cmds.Common.Helper.KeyValue<ISocketUser>;
    shortUsers: Cmds.Common.Helper.KeyValue<ISocketUser>;
    rooms:  Cmds.Common.Helper.KeyValue<Dts.IRoom>;
    constructor(nsp: ISocketNamespace) {
        super();
        this.nsp = nsp;
        this.nsp.users = this;
        this.users = new Cmds.Common.Helper.KeyValue();
        this.shortUsers = new Cmds.Common.Helper.KeyValue();
        this.sockets = new Cmds.Common.Helper.KeyValue();   
        this.rooms = new Cmds.Common.Helper.KeyValue();     

        this.initEvents();
    }
    destroy() {
        // this.clearSocketUsers();
        this.users.destroy();
        this.shortUsers.destroy();
        this.sockets.destroy();
        this.rooms.destroy();
        delete this.users;
        delete this.shortUsers;
        delete this.sockets;
        delete this.rooms;
        delete this.nsp.users;
        delete this.nsp;
        super.destroy();
    }

    initEvents() {
        this.nsp.on('connect', this.onConnect)
    }
    onConnect = (socket: SocketIO.Socket) => {
        console.log('ServerEvent', 'connect', socket.id)
        let sckUser = new SocketUser(socket);
        socket.once(Dts.EServerSocketEvents.disconnecting, () => {
            sckUser.onCommand({cmdId: Dts.ECommandId.network_disconnecting});
        })

        socket.once(Dts.EServerSocketEvents.disconnect, () => {
            sckUser.onCommand({cmdId: Dts.ECommandId.network_disconnect});
            sckUser.destroy();
            sckUser = null;
        });
    }       
}