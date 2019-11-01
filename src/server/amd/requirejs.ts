import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';

function requirejs(urlOrFile: string, modules: Array<string>, success?: (...args: any[]) => void, failed?:(error: string) => void, notEval?: boolean) {
    return new Promise((resolve, reject) => {
        let _useHttp = (url: string) => {
            try {
                let req = http.get(url, (function(res) {
                    let js = ''
                    exports = {};        
                    res.on('data',(data)=>{
                        js+=data;
                    });            
                    res.on('error',(e)=>{
                        failed && failed(e.message);
                        reject(e.message);
                    });
                    res.on('end',()=>{
                        if (res.statusCode >=200 && res.statusCode < 300) {
                            if (notEval && res.statusCode === 200) {
                                success && success(js)
                                resolve(js)                            
                                return;
                            } else {
                                _evalJs(js);
                            }
                        } else {
                            let error = res.statusCode + ' ' + res.statusMessage;
                            reject(error)                    
                        }
                    });
        
                }) as any)  
                
                req.on('error',(e)=>{
                    failed && failed(e.message);
                    reject(e.message);
                });
            } catch (error) {
                reject(error)              
            }
        }

        let _evalJs = (js: string) => {
            eval(js); 
            let _exports = {};
            let _exportsArr = [];
            
            modules = modules || [];
            modules = modules.length > 0 ? modules : Object.keys(exports);
            modules.forEach(name => {
                _exports[name] = exports[name];
                _exportsArr.push(exports[name])
            })
            success && success(..._exportsArr)
            resolve(_exports)
        }

        let _useFile = (file: string) => {
            if (fs.existsSync(file) && fs.lstatSync(file).isFile) {
                let buf = fs.readFileSync(file);
                let js = buf.toString();
                if (notEval) {
                    success && success(js)
                    resolve(js)   
                    return;
                } else {
                    _evalJs(js);
                }                
            } else {
                reject("file not exist:" + file);    
            }
        }


        let start = () => {
            let url = !!urlOrFile ? urlOrFile.trim() : "";
            if (url.indexOf("http://") >=0 || url.indexOf("https://") >=0 ) {
                _useHttp(url);
            } else {
                let file = path.resolve(__dirname, url);
                _useFile(file);
            }
        }

        start();
    })
}
export { requirejs }