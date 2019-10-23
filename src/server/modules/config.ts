import * as fs from 'fs';
import * as path from 'path'
import * as Amd from '../amd/index'
import * as Url from 'url'

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
export interface IHttpsOption2 {
    port: number,
    key: string | Array<string>,
    cert: string | Array<string>,
    ca: string | Array<string>
}

export interface IConfig {
    version: string
    updateUrl: string
    configUrl: string
    namespaces: {[name:string]: string}
    websites: {[name:string]: string}
    http: Array<IHttpOption>
    https: Array<IHttpsOption2>
    httpsOption2To1(option2: IHttpsOption2): IHttpsOption
}

export class Config implements IConfig {
    version: string
    configUrl: string
    updateUrl: string
    namespaces: {[name:string]: string}
    websites: {[name:string]: string}
    http: Array<IHttpOption>
    https: Array<IHttpsOption2>
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
                addrUrl = new Url.URL(addr)            
            } catch (error) {
                addrUrl = new Url.URL(url, this.updateUrl)                        
            }
            return addrUrl.toString()        
        }
    }
    static update(url?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let jsonConfig = this.getJsonConfig();
            let addr = url || jsonConfig.configUrl;
            let addrUrl: URL;
            try {
                addrUrl = new Url.URL(addr)            
            } catch (error) {
                addrUrl = new Url.URL(addr, jsonConfig.updateUrl)                        
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
    httpsOption2To1(option2: IHttpsOption2): IHttpsOption {
        let option: IHttpsOption = {
            port: option2.port,
            key: "",
            cert: "",
            ca: ""
        }

        let keyFile = "";
        let certFile = "";
        if (typeof option2.key == "string") {
            keyFile = path.resolve(__dirname, option2.key as any);
            certFile = path.resolve(__dirname, option2.cert as any);
        } else {
            for (let idx = 0; idx < option2.key.length; idx++) {
                let _keyFile = path.resolve(__dirname, option2.key[idx]);
                let _certFile = path.resolve(__dirname, option2.cert[idx]);     

                if (fs.existsSync(_keyFile) && fs.existsSync(_certFile)) {
                    keyFile = _keyFile;
                    certFile = _certFile;
                    break;
                }
            }
        }
        option.key = keyFile;
        option.cert = certFile;

        return option;
    }    

    namespacesExist(names: Array<string>): Array<string> {
        let result = [];
        names.forEach(name => {
            if (this.namespaces[name] !== undefined) 
                result.push(name)
        })
        return result;       
    }

    namespacesNotExist(names: Array<string>): Array<string> {
        let result = [];
        names.forEach(name => {
            if (this.namespaces[name] === undefined) 
                result.push(name)
        })
        return result;       
    }    
}