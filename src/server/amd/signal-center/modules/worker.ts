import * as Modules from '../../../modules'
import * as Dts from "../../../dts";

export interface ISocketWorker extends Modules.ISocketUser {

}

export class SocketWorker  extends Modules.SocketUser implements ISocketWorker {

    constructor(socket: Modules.IUserSocket) {
        super(socket)
    }

    destroy() {
        super.destroy();
    }

    initEvents() {
        this.socket.on(Dts.CommandID, this.onCommand);

        [Dts.EServerSocketEvents].forEach(events => {
            Object.keys(events).forEach(key => {
                let value = events[key];
                this.socket.addListener(value, (...args: any[]) => {
                    console.log('ServerEvent', value, ...args ? args[0]: '')
                })
            })
        })
    }
    unInitEvents() {
        this.socket.removeAllListeners();        
    }

    // Command business
    onCommand = (cmd: Dts.ICommandData<any>, cb?: (result: boolean) => void) => {     
        if (!this.user && cmd && cmd.cmdId !== Dts.ECommandId.adhoc_login) {
            cb && cb(false)
        } else {
            cb && cb(true)
            this.dispatcher.onCommand(cmd, this);
        }
    }
    sendCommand = (cmd: Dts.ICommandData<any>, includeSelf?: boolean) => {
        this.dispatcher && this.dispatcher.sendCommand(cmd, this, includeSelf);
    }
}