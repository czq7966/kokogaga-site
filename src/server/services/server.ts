import * as Amd from '../amd/index'
import * as Modules from '../modules'
import * as Dts from "../dts";
import { ICommandDeliverDataExtraProps } from '../amd/signal-client/dts';
import { ServiceUser } from './user';
import { ServiceNamespace } from './namespace';

export class ServiceServer  {
    static openNamespace(server: Modules.IServer, name: string): Promise<any> {
        let config = new Modules.Config()
        return new Promise((resolve, reject)=>{
            let snsp = server.snsps.get(name);            
            let nsp = server.socketioServer.nsps['/' + name];
            let _openNamespace = (_snsp?: Modules.ISocketNamespace) => {
                snsp = _snsp || new Modules.SocketNamespace(nsp, server);
                snsp.options = config.getNamespace(name);
                server.snsps.add(name, snsp);     
                server.getDatabase().createNamespace(name);
                !_snsp && console.log('Open default namespace : ', name);                                               
                resolve(snsp)
            }              
            if (!snsp) {              
                if (!nsp) {
                    nsp = server.socketioServer.of(name); 
                    let url = config.getNamespaceModuleUrl(name);                    

                    if (!url) {
                        _openNamespace();
                    } else {
                        Amd.requirejs(url, ["SocketNamespace"])
                        .then((modules: any) => {
                            let SNSP = modules.SocketNamespace;
                            if (SNSP){
                                snsp = new SNSP(nsp, server)
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
    static openNamespaces(server: Modules.IServer, names: string[]): Promise<any> {
        let promises = []
        names = names || [];
        names.forEach(name => {
            promises.push(this.openNamespace(server, name))
        })
        return Promise.all(promises)
    }    
    static closeNamespace(server: Modules.IServer, name: string): Promise<any> {
        return new Promise((resolve, reject)=>{
            if (name == "") {
                reject("Invalid namespace: " + name);
                return;
            }

            let nsp = server.socketioServer.nsps['/' + name];
            if (nsp) {
                Object.keys(nsp.sockets).forEach(key => {
                    let socket = nsp.sockets[key];
                    socket.disconnect(true);
                })

                if (Object.keys(nsp.sockets).length == 0) {
                    delete server.socketioServer.nsps['/' + name]
                    server.snsps.del(name);
                    server.getDatabase().destroyNamespace(name);
                    resolve()
                } else {
                    setTimeout(() => {
                        if (Object.keys(nsp.sockets).length == 0) {
                            delete server.socketioServer.nsps['/' + name]
                            server.snsps.del(name);
                            server.getDatabase().destroyNamespace(name);
                            resolve()
                        } else {
                            console.log('Close namespace timeout: ' , name, nsp.sockets.length)
                            reject('Namespace include sockets yet: ' + nsp.sockets.length)
                        }                        
                    }, 2000);                    
                }                
            } else {
                server.snsps.del(name);
                server.getDatabase().destroyNamespace(name);
                resolve()
            }         
        })

    }
    static closeNamespaces(server: Modules.IServer, names: string[]): Promise<any> {
        let promises = []
        names = names || [];
        names.forEach(name => {
            promises.push(this.closeNamespace(server, name))
        })
        return Promise.all(promises)
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
    static resetNamespaces(server: Modules.IServer, names: string[]): Promise<any> {
        names = names || server.snsps.keys();
        let promises = []
        names.forEach(name => {
            promises.push(this.resetNamespace(server, name))
        })
        return Promise.all(promises)
    }  
    static getNamespaceStatus(server: Modules.IServer, names: string[]): Object {
        let result = {}
        names.forEach(name => {
            result[name] = server.snsps.exist(name)
        })        
        return result;
    }  
    static async onDeliverCommand(server: Modules.IServer, cmd: Dts.ICommandData<any>) {
        let data = cmd.props as Dts.ICommandData<Dts.ICommandDataProps>;
        let extra = cmd.extra as Dts.ICommandData<ICommandDeliverDataExtraProps>;
        if (data && extra) {
            let snsp = server.snsps.get(extra.props.namespace); 
            if (snsp)
                return await ServiceNamespace.onDeliverCommand(snsp, cmd);
        }        
    }       
}