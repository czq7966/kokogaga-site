import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs';

export interface IHttpConfig {
    port: number
}
export interface IHttpsConfig {
    port: number,
    key: string,
    cert: string,
    ca: string
}


export interface IHttpServerOptions {
    port: number,
    listenlog: string,
    httpServer: http.Server | https.Server,    
}

export interface IConfig {
    version: string
    updateUrl: string
    namespaces: {[name:string]: string}
    http: Array<IHttpConfig>
    https: Array<IHttpsConfig>
}

export class Config implements IConfig {
    version: string
    updateUrl: string
    namespaces: {[name:string]: string}
    http: Array<IHttpConfig>
    https: Array<IHttpsConfig>
    constructor() {
        let jsonConfig;
        let file = './config.json';
        if (fs.existsSync(file)) {
            jsonConfig = JSON.parse(fs.readFileSync(file, 'utf8'))
        } else {
            jsonConfig = require('./config.json');
        }
        Object.assign(this, jsonConfig)
    }
    destroy() {

    }
    getNamespaceModuleUrl(nsp: string): string {
        let addr = this.namespaces[nsp] || nsp;
        let url = this.version + '/' + addr;
        let addrUrl: URL;
        try {
            addrUrl = new URL(addr)            
        } catch (error) {
            addrUrl = new URL(url, this.updateUrl)                        
        }
        return addrUrl.toString()        
    }
}