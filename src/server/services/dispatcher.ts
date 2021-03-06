import * as Cmds from "../cmds/index"
import * as Dts from '../cmds/dts'
import * as Modules from '../modules'
// import { SocketUser } from "../modules/user";


export interface IDispatcherConstructorParams extends Cmds.Common.IBaseConstructorParams {

}
export interface IDispatcher extends Cmds.Common.IDispatcher {
    polyfillCommand(cmd: Dts.ICommandData<any>, sckUser: Modules.ISocketUser): Dts.ICommandData<any>
    onCommand(cmd: Dts.ICommandData<any>, sckUser: Modules.ISocketUser): Promise<any>
    sendCommand(cmd: Dts.ICommandData<any>, sckUser: Modules.ISocketUser, includeSelf?: boolean): Promise<any>
}

export class Dispatcher extends Cmds.Common.Base implements IDispatcher {
    edCoder: Cmds.Common.IEDCoderClass
    isServer: boolean    
    constructor(params: IDispatcherConstructorParams, edCoder?: Cmds.Common.IEDCoderClass) {
        super(params);
        this.isServer = true;
        this.edCoder = edCoder || Cmds.Common.EDCoder;
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        super.destroy();
    }

    initEvents() {
        this.edCoder.addDispatcherInstance(this.instanceId, this);
    }
    unInitEvents() {
        this.edCoder.removeDispatcherInstance(this.instanceId);
    }

    polyfillCommand(cmd: Dts.ICommandData<any>, sckUser: Modules.ISocketUser): Dts.ICommandData<any> {
        cmd.type = cmd.type || Dts.ECommandType.req;
        cmd.from = cmd.from || {};
        cmd.from.type = cmd.from.type || (sckUser.user ? 'user' : 'socket');
        cmd.from.id = cmd.from.id || (sckUser.user ? sckUser.user.id : sckUser.socket.id)
        cmd.to = cmd.to || {};        
        cmd.to.type = cmd.to.type || 'server';
        cmd.to.id = cmd.to.id || '';    
        return cmd;    
    }

    async onCommand(cmd: Dts.ICommandData<any>, sckUser: Modules.ISocketUser): Promise<any> {
        cmd = this.polyfillCommand(cmd, sckUser);
        Logging.log(sckUser.users.snsp.nsp.name, Dts.CommandID + 'Event', cmd.cmdId, cmd.from, cmd.to);
        Cmds.Common.EDCoder.onCommand(cmd, this, sckUser);
    }

    sendCommand(cmd: Dts.ICommandData<any>, sckUser: Modules.ISocketUser, includeSelf?: boolean): Promise<any> {
        cmd.from = cmd.from || {};
        cmd.from.type = cmd.from.type || 'server';
        cmd.from.id = cmd.from.id || '';
        if (cmd.props === undefined) cmd.props = {};

        switch(cmd.to.type) {
            case 'room':
                cmd.to.id = cmd.to.id || sckUser.user.room.id;
                let uroom = sckUser.users.rooms.get(cmd.to.id)
                let sim = uroom && uroom.sim || cmd.to.id;
                sckUser.socket.to(sim).emit(Dts.CommandID, cmd);
                includeSelf && sckUser.socket.emit(Dts.CommandID, cmd);
                break;
            case 'socket':
                cmd.to.id = cmd.to.id || sckUser.socket.id;
                if (sckUser.socket.id === cmd.to.id) {
                    sckUser.socket.emit(Dts.CommandID, cmd);
                } else {
                    sckUser.socket.to(cmd.to.id).emit(Dts.CommandID, cmd);
                }
                break
            case 'user':
                cmd.to.id = cmd.to.id || sckUser.user.id;
                if (sckUser.user && (sckUser.user.id === cmd.to.id)) {
                    sckUser.socket.emit(Dts.CommandID, cmd);
                } else {
                    let toUser = sckUser.users.users.get(cmd.to.id);
                    if (toUser) {
                        sckUser.socket.to(toUser.socket.id).emit(Dts.CommandID, cmd)
                    }
                }
                break;
            case 'server':
                break;                
            default:
                sckUser.socket.emit(Dts.CommandID, cmd);
                break;
        }
        Logging.log(sckUser.users.snsp.nsp.name, 'SendCommand', cmd.cmdId, cmd.to)
        return ;
    }    
}

// Cmds.Common.EDCoder.setDispatcher(Dispatcher as any, true)