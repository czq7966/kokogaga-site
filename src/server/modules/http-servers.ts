import * as fs from 'fs'
import * as path from 'path'
import * as http from 'http'
import * as https from 'https'
import { Config, IConfig} from './config';
import { ExpressApp } from './express-app';

export interface IHttpServerOption {
    port: number,
    listenlog: string,
    httpServer: http.Server | https.Server,    
}

export interface IHttpServers {
    config: IConfig 
    servers: IHttpServerOption[]
    destroy()
}

export class HttpServers {
    servers: IHttpServerOption[]
    config: IConfig       
    constructor(config: IConfig) {               
        this.config = config;
        this.servers = [];
        this.createServers();

    }
    destroy() {
        this.servers.forEach(server => {
            server.httpServer.close();
        })
        delete this.config;
        delete this.servers;
    }    

    createServers(){
        this.createHttpServers();
        this.createHttpsServers();
    }
    createHttpServers() {
        let options = this.config.http || [];
        let nsps: Array<string> = Object.keys(this.config.namespaces || []);
        nsps.indexOf("") < 0 && nsps.push("");
        options.forEach(option => {
            let expressApp = new ExpressApp(nsps, this.config.websites);
            let httpServer = http.createServer(expressApp.express);
            let server: IHttpServerOption = {
                port: option.port,
                listenlog: 'listen on http port ' + option.port,
                httpServer: httpServer,
            }
            this.servers.push(server)
        })        
    }
    createHttpsServers() {
        let options = this.config.https || [];
        let nsps: Array<string> = Object.keys(this.config.namespaces || []);
        nsps.indexOf("") < 0 && nsps.push("");
        options.forEach(option2 => {            
            let option = this.config.httpsOption2To1(option2);
            let keyFile = option.key && option.key.length > 0 ? path.resolve(__dirname, option.key) : null;
            let certFile = option.cert && option.cert.length > 0 ? path.resolve(__dirname, option.cert) : null;
            if (keyFile && certFile && fs.existsSync(keyFile) && fs.existsSync(certFile)) {
                let expressApp = new ExpressApp(nsps, this.config.websites);
                let httpsOptions = {
                    key: fs.readFileSync(keyFile),
                    cert: fs.readFileSync(certFile),
                };  
                let httpsServer = https.createServer(httpsOptions, expressApp.express);
                let server: IHttpServerOption = {
                    port: option.port,
                    listenlog: 'listen on https port ' + option.port,
                    httpServer: httpsServer,
                }
                this.servers.push(server)
            } else {
                console.error('Error start https(port ' + option.port +')' + ', ssl file(s) not exist:  ' + keyFile + "," + certFile );
            }
        })   
    }
}