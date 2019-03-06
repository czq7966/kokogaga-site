import * as fs from 'fs'
import * as path from 'path'
import * as http from 'http'
import * as https from 'https'
import { Config} from './config';
import { ExpressApp } from './express-app';

export interface IHttpServerOption {
    port: number,
    listenlog: string,
    httpServer: http.Server | https.Server,    
}

export interface IHttpServers {
    servers: IHttpServerOption[]
    destroy()
}

export class HttpServers {
    servers: IHttpServerOption[]
    config: Config       
    constructor(config: Config) {               
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
            let expressApp = new ExpressApp(nsps);
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
        options.forEach(option => {
            let expressApp = new ExpressApp(nsps);
            let httpsOptions = {
                key: fs.readFileSync(path.resolve(__dirname, option.key)),
                cert: fs.readFileSync(path.resolve(__dirname, option.cert)),
            };  
            let httpsServer = https.createServer(httpsOptions, expressApp.express);
            let server: IHttpServerOption = {
                port: option.port,
                listenlog: 'listen on http port ' + option.port,
                httpServer: httpsServer,
            }
            this.servers.push(server)
        })   
    }
}