import * as fs from 'fs';
import * as Amd from '../amd/index'

var ConfigFile = './config.json'

export interface IHttpOption {
    port: number
}
export interface IHttpsOption {
    port: number,
    key: string,
    cert: string,
    ca: string
}

export interface IConfig {
    version: string
    updateUrl: string
    configUrl: string
    namespaces: {[name:string]: string}
    http: Array<IHttpOption>
    https: Array<IHttpsOption>
}

export class Config implements IConfig {
    version: string
    configUrl: string
    updateUrl: string
    namespaces: {[name:string]: string}
    http: Array<IHttpOption>
    https: Array<IHttpsOption>
    constructor() {
        let jsonConfig = Config.getJsonConfig();
        Object.assign(this, jsonConfig)        
    }
    destroy() {

    }
    getNamespaceModuleUrl(nsp: string): string {
        let addr = this.namespaces[nsp];
        if (addr) {
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
    static update(): Promise<any> {
        return new Promise((resolve, reject) => {
            let jsonConfig = this.getJsonConfig();

            let addr = jsonConfig.configUrl;
            let addrUrl: URL;
            try {
                addrUrl = new URL(addr)            
            } catch (error) {
                addrUrl = new URL(addr, jsonConfig.updateUrl)                        
            }
    
            Amd.requirejs(addrUrl.toString(), [], null, null, true)
            .then(data => {
                let file = ConfigFile;
                fs.writeFileSync(file, data);                
                console.log('Update config success ')
                resolve()
            })
            .catch(err => {
                console.log('Update config failed: ', err)
                reject(err)
            })
        })

    }
    static getJsonConfig(): IConfig {
        let file = ConfigFile;
        let jsonConfig: IConfig;
        if (fs.existsSync(file)) {
            jsonConfig = JSON.parse(fs.readFileSync(file, 'utf8'))
        } else {
            jsonConfig = require('./config.json');
        }    
        jsonConfig.updateUrl = jsonConfig.updateUrl[jsonConfig.updateUrl.length - 1] !== '/' ? jsonConfig.updateUrl + '/'  : jsonConfig.updateUrl;
        return jsonConfig;
    }
}