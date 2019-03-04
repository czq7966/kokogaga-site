import './cmds/index'
import * as Modules from './modules'
import * as http from 'http'
import * as https from 'https'


export interface IServerOptions {
    port: number,
    namespaces: Array<string>,
    listenlog: string,
    httpServer: http.Server | https.Server,    
    socketioServer: SocketIO.Server
}

export class Main {
    servers: Array<IServerOptions>

    constructor(servers: Array<IServerOptions>) {
        this.servers = servers;
        this.initEvents();       
        this.run(); 
    }    
    destroy() {
        this.unInitEvents();
        this.close();
    }

    initEvents() {
        this.servers.forEach(server => {
            server.namespaces.forEach(name => {
                let nsp = server.socketioServer.nsps['/' + name]
                if (!nsp) {
                    nsp = server.socketioServer.of(name);
                    let users = new Modules.SocketUsers(nsp);
                }
            })
        })

    }
    unInitEvents() {

    }
    run() {
        this.servers.forEach(server => {
            server.httpServer.listen(server.port);
            console.log(server.listenlog || 'listen on port ' + server.port)
        })
    }
    close() {
        this.servers.forEach(server => {        
            server.httpServer && server.httpServer.close();
        })
    }
}
