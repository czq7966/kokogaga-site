import * as Modules from '../../../modules'
import * as Dts from "../../../dts";

export interface ISocketWorker extends Modules.ISocketUser {

}

export class SocketWorker  extends Modules.SocketUser implements ISocketWorker {

    constructor(socket: Modules.IUserSocket) {
        super(socket)
        this.onCommand = this.onCommand2;
        this.sendCommand = this.sendCommand2;
        this.initEvents2();
    }

    destroy() {
        this.unInitEvents2();
        super.destroy();
    }

    //Override
    initEvents() {}
    unInitEvents() {}

    initEvents2(){
        this.socket.on(Dts.CommandID, this.onCommand2);

        [Dts.EServerSocketEvents].forEach(events => {
            Object.keys(events).forEach(key => {
                let value = events[key];
                this.socket.addListener(value, (...args: any[]) => {
                    console.log('ServerEvent111', value, ...args ? args[0]: '')
                })
            })
        })
    }
    unInitEvents2() {
        this.socket.removeAllListeners();        
    }

    // Command business
    onCommand2 = async (cmd: Dts.ICommandData<any>, cb?: (result: boolean) => void) => {     
        this.dispatcher.onCommand(cmd, this);
    }
    sendCommand2 = (cmd: Dts.ICommandData<any>, includeSelf?: boolean) => {
        this.dispatcher && this.dispatcher.sendCommand(cmd, this, includeSelf);
    }    
}