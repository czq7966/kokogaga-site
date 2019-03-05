import * as Cmds from "../cmds/index";
import { ISocketUsers, SocketUsers } from "./users";
import { IServers } from "./servers";

export interface ISocketIONamespace extends SocketIO.Namespace {
    snsp?: ISocketNamespace
}

export interface ISocketNamespace  {
    nsp: SocketIO.Namespace
    users?: ISocketUsers
    servers?: IServers
}

export class SocketNamespace  extends Cmds.Common.Base implements ISocketNamespace {
    nsp: ISocketIONamespace
    users?: ISocketUsers
    servers?: IServers

    constructor(nsp: ISocketIONamespace, servers?: IServers) {
        super()
        this.nsp = nsp;
        this.nsp.snsp = this;
        this.servers = servers
        this.users = new SocketUsers(this);
        this.initEvents();          
    }

    destroy() {
        this.unInitEvents();
        this.users.destroy();
        delete this.users;
        delete this.nsp.snsp
        delete this.nsp
        delete this.servers
        super.destroy();
    }

    initEvents() {

    }
    unInitEvents() {
       
    }
}