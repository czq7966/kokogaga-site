import * as Modules from '../../../modules'
import * as Cmds from '../cmds'
Cmds;

export class SocketNamespace  extends Modules.SocketNamespace  {
    constructor(nsp: Modules.ISocketIONamespace, server?: Modules.IServer) {
        super(nsp, server);
        this.useSignalCenter = false;
    }
}