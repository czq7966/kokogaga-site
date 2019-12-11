import * as Modules from '../../../modules'
import * as Dts from "../../../dts";
import { SocketWorker, ISocketWorker } from "./worker";


export interface ISocketWorkers extends Modules.ISocketUsers {

}

export class SocketWorkers extends Modules.SocketUsers implements ISocketWorkers {
    constructor(snsp: Modules.ISocketNamespace) {
        super(snsp);
    }
    destroy() {
        super.destroy();
    }

    initEvents() {
        this.snsp.nsp.on('connect', this.onConnect)
    }
    unInitEvents() {
        this.snsp.nsp.off('connect', this.onConnect)
    }
    onConnect = (socket: SocketIO.Socket) => {
        console.log('ServerEvent', 'connect', socket.id)
        let sckUser = new SocketWorker(socket);
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