import * as Cmds from '../cmds/index'
import { ISocketNamespace, ESocketNamespaceType } from './namespace';
import { Config, IConfig } from './config';
import { IHttpServers, HttpServers } from './http-servers';
import { ServiceServer } from '../services';
import { IGlobalExpcetion, GlobalExpcetion } from './global-exception';
import { ISignalClient } from '../amd/signal-client/signal-client';
import * as Helper from "../helper"
import * as path from 'path'
import * as Amd from '../amd/index'
import { ISocketUsers, SocketUsers } from './users';

export interface IServer {
    snsps: Cmds.Common.Helper.KeyValue<ISocketNamespace>
    httpServers: IHttpServers
    socketioServer: SocketIO.Server;
    globalExpcetion: IGlobalExpcetion
    getSignalClient(): ISignalClient
    getId(): string            
    getConfig(): IConfig
    newConfig(): IConfig
    newSocketUsers(snsp: ISocketNamespace): ISocketUsers
    initNamespaces(): Promise<any>
    unInitNamespaces(): Promise<any>
    resetNamespaces(): Promise<any>
    openNamespace(name: string): Promise<any>
    closeNamespace(name: string): Promise<any>
    resetNamespace(name: string): Promise<any>
    onDeliverCommand(cmd: Cmds.Common.ICommandData<any>): Promise<any>
}

export class Server implements IServer {
    static instance: IServer;
    id: string
    config: IConfig
    snsps: Cmds.Common.Helper.KeyValue<ISocketNamespace>
    httpServers: IHttpServers
    socketioServer: SocketIO.Server;
    globalExpcetion: IGlobalExpcetion;
    signalClient: ISignalClient;

    constructor() {
        Server.instance = this;
        this.id = '#server:' + Helper.uuid();
        this.config = new Config();
        this.httpServers = new HttpServers(this.getConfig());
        this.snsps = new Cmds.Common.Helper.KeyValue();
        this.initSocketIOServer();
        this.initNamespaces();
        this.initEvents();       
        this.run(); 
        this.globalExpcetion = new GlobalExpcetion(this)      
        // Amd.requirejs(path.resolve(__dirname, 'amd/signal-client/index.js'), [])
        // .then((modules: any) => {
        //     this.signalClient = new modules.SignalClient({instanceId: Helper.uuid()}, this);
        // });
    }    
    destroy() {
        this.unInitEvents();
        this.unInitNamespaces();
        this.unInitSocketIOServer();        
        this.signalClient && this.signalClient.destroy();
        this.globalExpcetion.destroy()
        this.httpServers.destroy();
        this.snsps.destroy();
        delete this.snsps;
        delete this.httpServers;
        delete this.globalExpcetion;
        delete this.signalClient;
    }
    initEvents() {

    }
    unInitEvents() {

    }    
    getId(): string {    
        return this.id;
    }
    getConfig(): IConfig {
        this.config = this.config || this.newConfig()
        return this.config;
    }
    newConfig(): IConfig {
        return new Config;
    }
    newSocketUsers(snsp: ISocketNamespace): ISocketUsers {
        return new SocketUsers(snsp);
    }
    getSignalClient(): ISignalClient {
        if (!this.signalClient) {
            this.snsps.keys().some(key => {
                let snsp = this.snsps.get(key);
                if (!snsp.options.disabled) {
                    switch(snsp.options.type) {
                        case ESocketNamespaceType.signalClient:
                        case ESocketNamespaceType.signalRedis:
                            this.signalClient = snsp as ISignalClient ;
                            return true;
                            break
                    } 
                }
            })
        }
        
        return this.signalClient
    }
        
    initSocketIOServer() {
        let server = this.httpServers.servers[0];
        let config = this.getConfig();
        let path = config.socketIOServer && config.socketIOServer.path || 'socket.io';
        path = path[0] != '/' ? '/' + path : path
        this.socketioServer = require('socket.io')(server.httpServer, {
                    transports: ['websocket'],
                    serveClient: false,
                    // path: path
                }) as SocketIO.Server;
        
        for (let index = 1; index < this.httpServers.servers.length; index++) {
            let server = this.httpServers.servers[index];
            this.socketioServer.attach(server.httpServer);
        }         
    }
    unInitSocketIOServer() {

    }
    initNamespaces(): Promise<any> {
        let config = this.newConfig()
        let promises = []
        Object.keys(config.namespaces).forEach(name => {
            promises.push(this.openNamespace(name))
        })
        return Promise.all(promises)
    }
    unInitNamespaces(): Promise<any> {
        let promises = []
        this.snsps.keys().forEach(name => {
            promises.push(this.closeNamespace(name))
        })        
        return Promise.all(promises)
    }
    resetNamespaces(): Promise<any> {
        return ServiceServer.resetNamespaces(this, this.snsps.keys())        
    }

    openNamespace(name: string): Promise<any> {
        return ServiceServer.openNamespace(this, name)
    }
    closeNamespace(name: string): Promise<any> {
        return ServiceServer.closeNamespace(this, name)
    }
    resetNamespace(name: string): Promise<any> {
        return ServiceServer.resetNamespace(this, name)
    }

    run() {
        // this.httpServers.servers.forEach(server => {
        //     server.httpServer.listen(server.port);
        //     console.log(server.listenlog || 'listen on port ' + server.port)
        // })

        this.httpServers.servers.forEach(server => {
            let listenError = () => {
                process.off('uncaughtException', listenError);
                server.httpServer.listen(() => {
                    console.log('listen on port ' + JSON.stringify(server.httpServer.address()))
                });                
            }
            process.on('uncaughtException', listenError);
            server.httpServer.listen(server.port, () => {
                process.off('uncaughtException', listenError);
                console.log(server.listenlog || 'listen on port ' + server.port)                
            });                

            // server.httpServer.listen(() => {
            //     console.log('listen on port ' + JSON.stringify(server.httpServer.address()))
            // });
        })
    }
    close() {
        this.socketioServer.close();
        this.httpServers.servers.forEach(server => {
            server.httpServer.close();
        })        
    }

    async onDeliverCommand(cmd: Cmds.Common.ICommandData<any>): Promise<any> {
        return await ServiceServer.onDeliverCommand(this, cmd);
    }
}
