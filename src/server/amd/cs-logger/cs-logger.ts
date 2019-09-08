
import * as fs from 'fs'
import * as path from 'path'
import * as Modules from '../../modules'


export interface ICertWatcher extends Modules.ISocketNamespace  {

}

export class SocketNamespace  extends Modules.SocketNamespace implements ICertWatcher {
    reloadTimerHandler: any;

    constructor(nsp: Modules.ISocketIONamespace, server?: Modules.IServer) {
        super(nsp, server);
    }

    destroy() {
        super.destroy();
    }

    initEvents() {
        super.initEvents();
        this.reloadCert();
        this.watch(10 * 1000);

    }
    unInitEvents() {
        if (!!this.reloadTimerHandler)
            clearTimeout(this.reloadTimerHandler);
        super.initEvents();
    }    

    watch(loadDelay: number) {
        let _delayLoad = () => {
            console.log("will reload certification after " + loadDelay + " milliseconds!")
            clearTimeout(this.reloadTimerHandler);
            this.reloadTimerHandler = setTimeout(() => {
                this.reloadTimerHandler = null;
                this.reloadCert();
            }, loadDelay);
        }
        
        let options = this.server.httpServers.config.https || [];
        options.forEach(option2 => {
            let option = this.server.httpServers.config.httpsOption2To1(option2);
            let keyFile = path.resolve(__dirname, option.key);
            let certFile = path.resolve(__dirname, option.cert);
            if (fs.existsSync(keyFile)) {
                fs.watch(keyFile, (event, filename) => {
                    _delayLoad();
                })
            }

            if (fs.existsSync(certFile)) {
                fs.watch(certFile, (event, filename) => {
                    _delayLoad();
                })
            }            
        });
    }

    reloadCert() {
        let _getServerByPort = (port: number) => {
            let result: Modules.IHttpServerOption;
            this.server.httpServers.servers.forEach(server => {
                if (server.port == port) {
                    result = server
                }
            })
            return result;
        }

        let options = this.server.httpServers.config.https || [];
        options.forEach(option2 => {
            let option = this.server.httpServers.config.httpsOption2To1(option2);
            let serverOption = _getServerByPort(option.port);
            let server = serverOption.httpServer as any;
            if (server && server._sharedCreds) {       
                let keyFile = path.resolve(__dirname, option.key);
                let certFile = path.resolve(__dirname, option.cert);                         
                server._sharedCreds.context.setCert(fs.readFileSync(certFile));
                server._sharedCreds.context.setKey(fs.readFileSync(keyFile));
                console.log("reload certification success on port: " + option.port, keyFile, certFile);
            }
        });        
    }
}