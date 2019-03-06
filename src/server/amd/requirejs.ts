import * as http from 'http'
function requirejs(url: string, modules: Array<string>, success?: (...args: any[]) => void, failed?:(error: string) => void, notEval?: boolean) {
    return new Promise((resolve, reject) => {
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

    })
}
export { requirejs }