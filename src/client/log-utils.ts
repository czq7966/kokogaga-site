import { Base } from "./connection/base";

//错误数据结构
export interface IErrorData {
    t: number,   // 资源时间
    n: string,  // 资源类型  resource，js，ajax，fetch,other
    msg: string // 错误信息
    method?: string  // 资源请求方式 GET，POST
    data: {
        resourceUrl?: string // 请求资源路径 
        col?: number // js错误行 
        line?: number    //js错误列
        status?: number  // 错误状态
        text?: string    // 错误信息
        target?: string  // 请求路径
        type?: string    // 错误类型 
        params?: any   //错误参数
    } 
}

export enum ELogEvents {
    log = 'log',
    dir = 'dir',
    warn = 'warn',
    error = 'error',
    trace = 'trace'
}

class CLogUtils extends Base {
    enabled: boolean;
    constructor() {
        super()
        this.enabled = true;
        this.hookConsole();
    }
    destroy() {
        super.destroy()
    }

    hookConsole() {
        Object.keys(ELogEvents).forEach(event => {
            this['_'+event] = console[event];
            console[event] = (...args: any[]) => {
                this.enabled && this['_'+event](...args);
                this.eventEmitter.emit(event, ...args);
            }
        })
    }
}
var LogUtils = new CLogUtils();
export { LogUtils }


// 拦截页面 error信息
class ErrorHook {
    static hooked: boolean;
    static start = function() {
        if (!ErrorHook.hooked) {
            ErrorHook.hookError();
            ErrorHook.hookOnError();
            ErrorHook.hookUnhandledRejection();
            // ErrorHook.hookConsoleError();
            ErrorHook.hooked = true;
        }
    }
    //捕获 资源加载时 错误, 如： img,script,css,jsonp, 
    private static hookError = function () {
        window.addEventListener('error', function (error: ErrorEvent) { //IE8 下error为string                 
            let elem = error.target as Element;            
            let errItem: IErrorData = {
                t: Date.now(),   // 资源时间
                n: 'resource',  // 资源类型  resource，js，ajax，fetch,other
                msg: elem ? elem.localName + ' is load error' : error as any, // 错误信息
                method: 'GET',  // 资源请求方式 GET，POST
                data: {
                    resourceUrl: elem? elem['currentSrc'] : error as any,  // 请求资源路径 
                    target: elem ? elem.localName: error as any,
                    type: error.type,
                    status: 0,  // 错误状态
                    text: error.message || error as any,    // 错误信息
                    col: error.colno || 0, // js错误行 
                    line: error.lineno || 0,    //js错误列  
                }                                         
           }        
           console.log(errItem)

        }, true);
    }
    //捕获 脚本运行时 错误
    private static hookOnError = function () {
        let windowOnError = window.onerror;
        window.onerror = function (event: Event | string, source?: string, fileno?: number, columnNumber?: number, error?: Error) {
            setTimeout(function () {
                let errItem: IErrorData = {
                    t: Date.now(),   
                    n: 'js',  
                    msg: error && error.stack ? error.stack.toString() : event as string, 
                    method: 'GET', 
                    data: {
                        resourceUrl: source,
                        text: error ? error.message : event as string,    // 错误信息
                        col: columnNumber || 0, // js错误行 
                        line: fileno || 0,    //js错误列  
                    }                         
                }   
                console.log(errItem)
            }, 0);
            windowOnError && windowOnError.apply(window, arguments); 
            
        }; 
    }
    //捕获 promise被reject并且错误信息没有被处理时 错误
    private static hookUnhandledRejection = function () {
        window.addEventListener('unhandledrejection', event => {
            let errItem: IErrorData = {
                t: Date.now(),   
                n: 'promise',  
                msg: 'promise error', 
                method: event.type, 
                data: {
                    text: event.reason,    // 错误信息
                }                         
            }  
            console.log(errItem) 
        })    
    }
    //捕获 控制台错误输出 console.error
    private static hookConsoleError = function() {
        let consoleError = window.console.error; 
        window.console.error = function (message?: any, ...optionalParams: any[]) { 
            let errItem: IErrorData = {
                t: Date.now(),   
                n: 'console',  
                msg: 'console error', 
                method: 'NONE', 
                data: {
                    text: message,    // 错误信息
                    params: optionalParams as any
                }                         
            }               
            consoleError && consoleError.apply(window, arguments); 
            console.log(errItem)
        };
    }
} 

ErrorHook.start();