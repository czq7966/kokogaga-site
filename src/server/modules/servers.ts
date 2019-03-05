import * as Cmds from '../cmds/index'
import { SocketNamespace, ISocketNamespace } from './namespace';
import { requirejs } from '../amd/requirejs';
import { Config, IHttpServerOptions } from './config';

export interface IServers {

}

export class Servers {
    snsps: Cmds.Common.Helper.KeyValue<ISocketNamespace>
    httpServers: Array<IHttpServerOptions>
    socketioServer: SocketIO.Server;

    constructor(httpServers: Array<IHttpServerOptions>) {
        this.httpServers = httpServers;
        this.snsps = new Cmds.Common.Helper.KeyValue();
        this.initServers();
        this.initNamespaces();
        this.initEvents();       
        this.run(); 
    }    
    destroy() {
        this.snsps.destroy();
        delete this.snsps;
        delete this.httpServers;
        this.unInitEvents();
        this.unInitNamespaces();
        this.unInitServers();
        this.close();
    }
    initServers() {
        let server = this.httpServers[0]
        this.socketioServer = require('socket.io')(server.httpServer, {
                    transports: ['websocket'],
                    serveClient: false,
                }) as SocketIO.Server;
        
        for (let index = 1; index < this.httpServers.length; index++) {
            let server = this.httpServers[index];
            this.socketioServer.attach(server.httpServer);
        }         
    }
    unInitServers() {

    }
    initNamespaces() {
        let config = new Config()
        Object.keys(config.namespaces).forEach(name => {
            this.openNamespace(name)
        })
    }
    unInitNamespaces() {
        this.snsps.keys().forEach(name => {
            this.closeNamespace(name)
        })        
    }

    initEvents() {

    }
    unInitEvents() {

    }

    openNamespace(name: string): Promise<any> {
        return new Promise((resolve, reject)=>{
            let snsp = this.snsps.get(name);
            if (!snsp) {
                let nsp = this.socketioServer.nsps['/' + name];
                if (!nsp) {
                    nsp = this.socketioServer.of(name);        
                    let config = new Config()
                    let url = config.getNamespaceModuleUrl(name);
                    requirejs(url, ["SocketNamespace"])
                    .then((modules: any) => {
                        let SNSP = modules.SocketNamespace;
                        if (SNSP)
                            snsp = new SNSP(nsp, this)
                        else 
                            snsp = new SocketNamespace(nsp, this)

                        this.snsps.add(name, snsp);
                        resolve(snsp)                            
                    })
                    .catch(err => {
                        console.error(err);
                        snsp = new SocketNamespace(nsp, this)
                        this.snsps.add(name, snsp);
                        resolve(snsp)
                    })
                } else {
                    snsp = new SocketNamespace(nsp, this)
                    this.snsps.add(name, snsp);
                    resolve(snsp)
                }
            } else {
                resolve(snsp)
            }
        })

    }
    closeNamespace(name: string): Promise<any> {
        return new Promise((resolve, reject)=>{
            let snsp = this.snsps.get(name);
            if (snsp) {
                let nsp = this.socketioServer.nsps['/' + name];
                if (nsp) {
                    Object.keys(nsp.sockets).forEach(key => {
                        let socket = nsp.sockets[key];
                        socket.disconnect(true);
                    })
                }
                if (Object.keys(nsp.sockets).length == 0) {
                    delete this.socketioServer.nsps['/' + name]
                    this.snsps.del(name)
                    resolve()
                } else {
                    setTimeout(() => {
                        if (Object.keys(nsp.sockets).length == 0) {
                            delete this.socketioServer.nsps['/' + name]
                            this.snsps.del(name)
                            resolve()
                        } else {
                            reject(nsp.sockets)
                        }                        
                    }, 2000);                    
                }                
            }            
        })

    }

    run() {
        this.httpServers.forEach(server => {
            server.httpServer.listen(server.port);
            console.log(server.listenlog || 'listen on port ' + server.port)
        })
    }
    close() {
        this.socketioServer.close();
    }
}
