import { SocketUser, ISocketUser } from "./user";
import * as Dts from "../dts";
import * as Cmds from "../cmds/index";
import { ISocketNamespace } from "./namespace";
import { IDataNamespace } from "./database";


export interface ISocketUsers extends Cmds.Common.IBase {
    snsp: ISocketNamespace
    users: Cmds.Common.Helper.KeyValue<ISocketUser>;
    sockets: Cmds.Common.Helper.KeyValue<ISocketUser>;
    shortUsers: Cmds.Common.Helper.KeyValue<ISocketUser>;
    rooms:  Cmds.Common.Helper.KeyValue<Dts.IRoom>;
    onConnect: (socket: SocketIO.Socket) => any;
    getDataNamespace(): IDataNamespace
}

export class SocketUsers extends Cmds.Common.Base implements ISocketUsers {
    snsp: ISocketNamespace
    users: Cmds.Common.Helper.KeyValue<ISocketUser>;
    sockets: Cmds.Common.Helper.KeyValue<ISocketUser>;
    shortUsers: Cmds.Common.Helper.KeyValue<ISocketUser>;
    rooms:  Cmds.Common.Helper.KeyValue<Dts.IRoom>;
    constructor(snsp: ISocketNamespace) {
        super();
        this.snsp = snsp;
        this.snsp.users = this;
        this.users = new Cmds.Common.Helper.KeyValue(true, this);
        this.shortUsers = new Cmds.Common.Helper.KeyValue(true, this);
        this.sockets = new Cmds.Common.Helper.KeyValue(true, this);   
        this.rooms = new Cmds.Common.Helper.KeyValue(true, this);     

        this.initEvents();
    }
    destroy() {
        // this.clearSocketUsers();
        this.unInitEvents();
        this.users.destroy();
        this.shortUsers.destroy();
        this.sockets.destroy();
        this.rooms.destroy();
        delete this.users;
        delete this.shortUsers;
        delete this.sockets;
        delete this.rooms;
        delete this.snsp.users;
        delete this.snsp;
        super.destroy();
    }

    initEvents() {
        this.snsp.nsp.on('connect', this.onConnect)
    }
    unInitEvents() {
        this.snsp.nsp.off('connect', this.onConnect)
    }
    onConnect = (socket: SocketIO.Socket) => {
        Logging.log('ServerEvent', 'connect', socket.id)
        let sckUser = new SocketUser(socket);
        socket.once(Dts.EServerSocketEvents.disconnecting, () => {
            sckUser.onCommand({cmdId: Dts.ECommandId.network_disconnecting});
        })

        socket.once(Dts.EServerSocketEvents.disconnect, async () => {
            try {
                await sckUser.onCommand({cmdId: Dts.ECommandId.network_disconnect});
                await this.delayDestroyUser(sckUser);
            } catch(e) {
                await this.delayDestroyUser(sckUser);
            }
        });
    }       
    async delayDestroyUser(sckUser: ISocketUser, timeout?: number, maxCount?: number, rightNow?: boolean) {
        timeout = timeout || 100;
        maxCount = maxCount || 300;

        let destroy = () => {
            maxCount = maxCount - 1;                
            setTimeout(() => {
                if (!sckUser.isLogin() || maxCount <=0) {
                    // setTimeout(() => {
                        sckUser.destroy();     
                    // }, 10 * 1000);
                } else {
                    destroy()
                }
            }, timeout);                
        }
        return destroy();
    }
    getDataNamespace(): IDataNamespace {
        return this.snsp.server.getDatabase().getNamespace(this.snsp.options.name);
    }
}