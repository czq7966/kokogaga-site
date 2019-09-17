import * as Modules from '../../modules'

export interface IAdmin extends Modules.ISocketNamespace  {

}

export class SocketNamespace  extends Modules.SocketNamespace implements IAdmin {

    constructor(nsp: Modules.ISocketIONamespace, server?: Modules.IServer) {
        super(nsp, server);
    }

    destroy() {
        super.destroy();
    }

}