import * as Modules from '../../../modules'
import * as Cmds from '../cmds'
import { IDatabase, Database } from './database';
Cmds;

export interface ISignalCenterSocketNamespace {
    database: IDatabase;
}

export class SocketNamespace  extends Modules.SocketNamespace implements ISignalCenterSocketNamespace {
    database: IDatabase;
    constructor(nsp: Modules.ISocketIONamespace, server?: Modules.IServer) {
        super(nsp, server);
        this.database = new Database();
    }
}