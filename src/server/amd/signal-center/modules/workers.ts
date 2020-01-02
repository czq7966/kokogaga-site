import * as Modules from '../../../modules'
import * as Dts from "../../../dts";
import { SocketWorker, ISocketWorker } from "./worker";


export interface ISocketWorkers extends Modules.ISocketUsers {

}

export class SocketWorkers extends Modules.SocketUsers implements ISocketWorkers {
    constructor(snsp: Modules.ISocketNamespace) {
        super(snsp);
        this.onConnect = this.onConnect2;
        this.initEvents2();
    }
    destroy() {
        this.unInitEvents2();
        super.destroy();
    }

    //Override 
    initEvents() {}
    unInitEvents() {}

    initEvents2() {
        this.snsp.nsp.on('connect', this.onConnect2)
    }
    unInitEvents2() {
        this.snsp.nsp.off('connect', this.onConnect2)
    }    
    onConnect2 = (socket: SocketIO.Socket) => {
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