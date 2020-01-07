import * as fs from 'fs';
import * as path from 'path'
import * as Amd from '../amd/index'
import * as Url from 'url'
import * as Cmds from "../cmds/index";
import { ISocketNamespaceOptions, ESocketNamespaceType } from './namespace';

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

export interface IRtcConfig {
    codec: string
    iceTransportPolicy: string
    iceServers: []
}
export interface IClientConfig {
    rtcConfig: IRtcConfig
}
export interface ISignalCenter {
    enabled: boolean
    signalerBase: string,
    namespace: string
}
export interface ISignalRedis {
    enabled: boolean
    url: string
}
export interface ISocketIOServer {
    path: string
}

export interface IConfig {
    version: string
    updateUrl: string
    configUrl: string
    autoUpdateConfig: boolean
    namespaces: {[name:string]: string} | {[name:string]: ISocketNamespaceOptions}
    websites: {[name:string]: string}
    clientConfig: IClientConfig
    http: Array<IHttpOption>
    https: Array<IHttpsOption2>
    signalCenter: ISignalCenter 
    signalRedis: ISignalRedis
    socketIOServer: ISocketIOServer
    destroy()
    httpsOption2To1(option2: IHttpsOption2): IHttpsOption
}

export class Config extends Cmds.Common.Base implements IConfig {
    version: string
    configUrl: string
    updateUrl: string
    autoUpdateConfig: boolean
    namespaces: {[name:string]: string} | {[name:string]: ISocketNamespaceOptions}
    websites: {[name:string]: string}
    clientConfig: IClientConfig
    http: Array<IHttpOption>
    https: Array<IHttpsOption2>
    signalCenter: ISignalCenter   
    signalRedis: ISignalRedis 
    socketIOServer: ISocketIOServer
    constructor() {
        super();
        let jsonConfig = Config.getJsonConfig();
        Object.assign(this, jsonConfig)        
    }
    destroy() {
        super.destroy();
    }

    getNamespaces(): {[name:string]: ISocketNamespaceOptions} {
        let namespaces: {[name:string]: ISocketNamespaceOptions} = {};
        Object.keys(this.namespaces).forEach(key => {
            let namespace = this.namespaces[key];
            let options: ISocketNamespaceOptions;
            if (typeof(namespace) == 'string') {
                options = {
                    name: key,
                    url: namespace,
                    type: ESocketNamespaceType.common
                }
            } else {
                options = namespace;
            }
            options.name = options.name || key;
            namespaces[key] = options;
        })
        return namespaces;
    }
    getNamespace(name: string): ISocketNamespaceOptions {    
        return this.getNamespaces()[name];
    }
    getNamespaceModuleUrl(nsp: string): string {
        let namespace = this.getNamespace(nsp);
        let addr = namespace.url;
        if (addr) {
            if (this.updateUrl && (this.updateUrl.indexOf("http://") >=0 || this.updateUrl.indexOf("https://") >= 0)) {
                let url = this.version + '/' + addr;
                let addrUrl: URL;
                try {
                    addrUrl = new Url.URL(addr)            
                } catch (error) {
                    addrUrl = new Url.URL(url, this.updateUrl)                        
                }
                return addrUrl.toString()        
            } else {
                return addr;
            }
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
                Config.getInstance<Config>().destroy();
                Config.getInstance<Config>();
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
                } else {
                    keyFile = _keyFile;
                    certFile = _certFile;
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
            if (this.getNamespace(name) !== undefined) 
                result.push(name)
        })
        return result;       
    }

    namespacesNotExist(names: Array<string>): Array<string> {
        let result = [];
        names.forEach(name => {
            if (this.getNamespace(name) === undefined) 
                result.push(name)
        })
        return result;       
    }    
}