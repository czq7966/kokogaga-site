import * as Cmds_Common from '../cmds/common/index'
import * as Helper from "../helper"
import { ISocketUsers } from "./users";
import { IServer } from "./server";
import { IConfig } from "./config";

export interface ISocketIONamespace extends SocketIO.Namespace {
    snsp?: ISocketNamespace
}

export enum ESocketNamespaceType {
    common = "common",
    admin = "admin",
    certWatcher = "certWatcher",
    csLogger = "cslogger",
    signalCenter = "signalCenter",
    signalClient = "signalClient",
    signalRedis = "signalRedis"
}

export interface ISocketNamespaceOptions<T> {
    name: string,
    url: string,
    type: ESocketNamespaceType
    disabled?: boolean
    useSignalCenter?: boolean
    extra?: T
}

export interface ISocketNamespace extends Cmds_Common.IBase {
    nsp: SocketIO.Namespace
    users?: ISocketUsers
    server?: IServer
    config: IConfig   
    options: ISocketNamespaceOptions<any>
}

export class SocketNamespace  extends Cmds_Common.Base implements ISocketNamespace {
    nsp: ISocketIONamespace
    users?: ISocketUsers
    server?: IServer
    config: IConfig   
    options: ISocketNamespaceOptions<any>

    constructor(nsp: ISocketIONamespace, server?: IServer, options?: ISocketNamespaceOptions<any>) {
        super({instanceId: Helper.uuid() })
        this.nsp = nsp;        
        this.options = options || {
            name: nsp.name[0] == '/' ? nsp.name.substr(1) : nsp.name,
            url: "",
            type: ESocketNamespaceType.common
        }
        this.nsp.snsp = this;
        this.server = server
        this.config = this.server.newConfig();
        this.users = this.server.newSocketUsers(this);
    }

    destroy() {
        this.users.destroy();
        delete this.users;
        delete this.nsp.snsp
        delete this.nsp
        delete this.server
        super.destroy();
    }
}