import * as Modules_Namespace from '../../../modules/namespace'
import * as Services from '../services'
import { ADHOCCAST } from '../libex'
import { IRedisSignaler } from './redis-signaler';
import { ISocketUser } from '../../../modules/user'
import { ISocketUsers } from '../../../modules/users'
import { IDatabase, IDataNamespace, IDataNamespaces } from '../../../modules/database';
import { DataNamespaceWrap } from './datanamespace-wrap';
import { IServer } from '../../../modules/server';
import { IDataNamespacesWrap, DataNamespacesWrap } from './datanamespaces-wrap';

export interface IDatabaseWrap extends IDatabase {
    getSignaler(): IRedisSignaler
    getDatabase(): IDatabase    
}

export class DatabaseWrap extends ADHOCCAST.Cmds.Common.Base implements IDatabaseWrap {
    signaler: IRedisSignaler
    database: IDatabase
    namespaces: IDataNamespacesWrap
    
    constructor(signaler: IRedisSignaler, database: IDatabase) {
        super();
        this.signaler = signaler;
        this.database = database;
        this.namespaces = new DataNamespacesWrap(this);
        this.wrapDataNamespaces();
    }
    destroy() {
        this.namespaces.destroy();
        delete this.namespaces;
        super.destroy()
    }
    wrapDataNamespaces() {
        this.getDatabase().getNamespaces().keys().forEach(namespace => {
            this.getNamespace(namespace);
        })
    }
    getSignaler(): IRedisSignaler {
        return this.signaler;
    }
    getDatabase(): IDatabase {
        return this.database;
    }
    getPath(): string {
        return this.getDatabase().getPath()
    }
    getServer(): IServer {
        return this.getDatabase().getServer();
    }
    isReady(): boolean {
        return this.getDatabase().isReady() && this.getSignaler().isReady()
    }
    createNamespace(namespace: string): IDataNamespace {        
        let nspWrap = this.namespaces.get(namespace);
        if (!nspWrap) {
            let nsp = this.database.createNamespace(namespace);
            nspWrap = new DataNamespaceWrap(this, nsp);
            this.namespaces.add(namespace, nspWrap);
        }
        return nspWrap;
    }
    destroyNamespace(namespace: string) {
        let nspWrap = this.namespaces.get(namespace);
        nspWrap && nspWrap.destroy();
        this.database.destroyNamespace(namespace);
    }
    getNamespace(namespace: string): IDataNamespace {
        let nspWrap = this.namespaces.get(namespace); 
        if (!nspWrap) {
            let nsp = this.database.getNamespace(namespace);
            let useSignalCenter = this.getServer().getNamespace(namespace).options.useSignalCenter
            if (nsp) {
                if (useSignalCenter) {
                    nspWrap = this.createNamespace(namespace)
                }
                else {
                    this.namespaces.add(namespace, nsp);
                }
            }
        }
        return nspWrap;
    }
    getNamespaces(): IDataNamespaces {
        return this.namespaces;
    }    
}