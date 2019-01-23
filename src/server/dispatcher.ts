import { Base, CmdDispatcher, IBaseConstructorParams, IDispatcher } from "./cmds/index"
import * as Dts from './cmds/dts'
import { SocketUser } from "./user";


export interface IDispatcherConstructorParams extends IBaseConstructorParams {

}

export class Dispatcher extends Base implements IDispatcher {
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

    onCommand = (cmd: Dts.ICommandData, sckUser: SocketUser) => {
        cmd.type = cmd.type || Dts.ECommandType.req;
        cmd.from = cmd.from || {};
        cmd.from.id = cmd.from.id || sckUser.user ? sckUser.user.id : sckUser.socket.id
        cmd.from.type = cmd.from.type || sckUser.user ? 'user' : 'socket';
        cmd.to = cmd.to || {};        
        cmd.to.type = cmd.to.type || 'server';
        cmd.to.id = cmd.to.id || '';
        
        CmdDispatcher.onCommand(cmd, this, sckUser);
    }
    sendCommand(cmd: Dts.ICommandData): Promise<any> {
        return;
    }
}

CmdDispatcher.setDispatcher(Dispatcher as any)