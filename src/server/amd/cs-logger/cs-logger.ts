
import * as fs from 'fs'
import * as path from 'path'
import * as Modules from '../../modules'


export interface ICertWatcher extends Modules.ISocketNamespace  {

}

export class SocketNamespace  extends Modules.SocketNamespace implements ICertWatcher {
    constructor(nsp: Modules.ISocketIONamespace, server?: Modules.IServer, options?: Modules.ISocketNamespaceOptions) {
        super(nsp, server, options);
        this.initEvents();

    }

    destroy() {
        this.unInitEvents();
        super.destroy();
    }

    initEvents() {


    }
    unInitEvents() {

    }    

}