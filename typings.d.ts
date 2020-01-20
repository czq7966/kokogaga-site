
declare var adhoc_cast_connection_console : {
    log(...args: any[])
    warn(...args: any[])
    dir(...args: any[])
    trace(...args: any[])
    error(...args: any[])
}

declare var Logging : {
    enabled: boolean
    log(...args: any[])
    warn(...args: any[])
    dir(...args: any[])
    trace(...args: any[])
    error(...args: any[])
}

declare var global: any;
declare var IsNode: boolean;



interface Window {
    mynode: typeof mynode;
}

declare namespace mynode {
    var electron: Electron.MainInterface;
    var process: NodeJS.Process;
    var fs: any;
    var path: any;
    var robotjs: any;
}