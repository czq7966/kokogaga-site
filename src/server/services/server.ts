import * as Amd from '../amd/index'
import * as Modules from '../modules'

export class ServiceServer  {
    static openNamespace(server: Modules.IServer, name: string): Promise<any> {
        return new Promise((resolve, reject)=>{
            let snsp = server.snsps.get(name);
            let nsp = server.socketioServer.nsps['/' + name];
            let _openNamespace = (_snsp?: Modules.ISocketNamespace) => {
                snsp = _snsp || new Modules.SocketNamespace(nsp, server)
                server.snsps.add(name, snsp);                        
                !_snsp && console.log('Open default namespace : ', name);                                               
                resolve(snsp)
            }              
            if (!snsp) {              
                if (!nsp) {
                    nsp = server.socketioServer.of(name); 
                    let config = new Modules.Config()
                    let url = config.getNamespaceModuleUrl(name);                    

                    if (!url) {
                        _openNamespace();
                    } else {
                        Amd.requirejs(url, ["SocketNamespace"])
                        .then((modules: any) => {
                            let SNSP = modules.SocketNamespace;
                            if (SNSP){
                                snsp = new SNSP(nsp, this)
                                console.log('Open Namespace Success(' + name +'): ', url);
                                _openNamespace(snsp)
                            }
                            else {
                                console.log('SocketNamespace not exist : ', Object.keys(modules));
                                _openNamespace()
                            }
                        })
                        .catch(err => {
                            console.log('Open Namespace Error(will use default): ', name, err, url);
                            _openNamespace()
                        })
                    }

                } else {
                    _openNamespace();
                }
            } else {
                resolve(snsp)
            }
        })
    }
    static closeNamespace(server: Modules.IServer, name: string): Promise<any> {
        return new Promise((resolve, reject)=>{
            let nsp = server.socketioServer.nsps['/' + name];
            if (nsp) {
                Object.keys(nsp.sockets).forEach(key => {
                    let socket = nsp.sockets[key];
                    socket.disconnect(true);
                })

                if (Object.keys(nsp.sockets).length == 0) {
                    delete server.socketioServer.nsps['/' + name]
                    server.snsps.del(name)
                    resolve()
                } else {
                    setTimeout(() => {
                        if (Object.keys(nsp.sockets).length == 0) {
                            delete server.socketioServer.nsps['/' + name]
                            server.snsps.del(name)
                            resolve()
                        } else {
                            console.log('Close namespace timeout: ' , name, nsp.sockets.length)
                            reject(nsp.sockets)
                        }                        
                    }, 2000);                    
                }                
            } else {
                server.snsps.del(name);
                resolve()
            }         
        })

    }
    static resetNamespace(server: Modules.IServer, name: string): Promise<any> {
        return new Promise((resolve, reject)=>{
            this.closeNamespace(server, name)
            .then(() => {
                this.openNamespace(server, name)
                .then(() => {
                    resolve()
                })
                .catch(err => {
                    reject(err)
                })
            })
            .catch(err => {
                reject(err)
            })
        })
    }    
    static resetNamespaces(server: Modules.IServer): Promise<any> {
        return new Promise((resolve, reject) => {
            server.unInitNamespaces()
            .then(() => {
                server.initNamespaces()
                .then((data) => {
                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
            })
            .catch(err => {
                reject(err)
            })        
        })
    }    

}