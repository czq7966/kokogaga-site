import * as Cmds from "../cmds/index";
import { ISocketUsers, SocketUsers } from "./users";
import { IServer } from "./server";

export interface ISocketIONamespace extends SocketIO.Namespace {
    snsp?: ISocketNamespace
}

export interface ISocketNamespace  {
    nsp: SocketIO.Namespace
    users?: ISocketUsers
    server?: IServer
}

export class SocketNamespace  extends Cmds.Common.Base implements ISocketNamespace {
    nsp: ISocketIONamespace
    users?: ISocketUsers
    server?: IServer

    constructor(nsp: ISocketIONamespace, server?: IServer) {
        super()
        this.nsp = nsp;
        this.nsp.snsp = this;
        this.server = server
        this.users = new SocketUsers(this);
        this.initEvents();          
    }

    destroy() {
        this.unInitEvents();
        this.users.destroy();
        delete this.users;
        delete this.nsp.snsp
        delete this.nsp
        delete this.server
        super.destroy();
    }

    initEvents() {

    }
    unInitEvents() {
       
    }
}