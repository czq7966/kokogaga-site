import * as Cmds from "../cmds/index"
import * as Dts from '../cmds/dts'
import * as Modules from '../modules'
// import { SocketUser } from "../modules/user";


export interface IDispatcherConstructorParams extends Cmds.Common.IBaseConstructorParams {

}

export class Dispatcher extends Cmds.Common.Base implements Cmds.Common.IDispatcher {
    constructor(params: IDispatcherConstructorParams) {
        super(params);
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        super.destroy();
    }

    initEvents() {

    }
    unInitEvents = () => {

    }

    onCommand = (cmd: Dts.ICommandData<any>, sckUser: Modules.SocketUser) => {
        cmd.type = cmd.type || Dts.ECommandType.req;
        cmd.from = cmd.from || {};
        cmd.from.type = cmd.from.type || sckUser.user ? 'user' : 'socket';        
        cmd.from.id = cmd.from.id || sckUser.user ? sckUser.user.id : sckUser.socket.id
        cmd.to = cmd.to || {};        
        cmd.to.type = cmd.to.type || 'server';
        cmd.to.id = cmd.to.id || '';

        console.log(Dts.CommandID + 'Event', cmd.cmdId, cmd.from, cmd.to);
        Cmds.Common.CmdDispatcher.onCommand(cmd, this, sckUser);
    }
    sendCommand(cmd: Dts.ICommandData<any>): Promise<any> {
        return;
    }
}

Cmds.Common.CmdDispatcher.setDispatcher(Dispatcher as any)