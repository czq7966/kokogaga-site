import * as Dts from './dts';
import { SocketUser } from "../user";
import { Base } from '../base';

class Dispatcher extends Base {
    dispatch(sckUser: SocketUser, cmd: Dts.ICommandData) {
        cmd.type = cmd.type || Dts.ECommandType.req;
        cmd.from = cmd.from || {};
        cmd.from.id = cmd.from.id || sckUser.user ? sckUser.user.id : sckUser.socket.id
        cmd.from.type = cmd.from.type || sckUser.user ? 'user' : 'socket';
        cmd.to = cmd.to || {};

        this.eventEmitter.emit(cmd.cmdId, sckUser, cmd)
    }
}

export var dispatcher = new Dispatcher();



