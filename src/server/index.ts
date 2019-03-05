import * as fs from 'fs';
import * as path from 'path'
import * as http from 'http'
import * as https from 'https'
import * as Modules from './modules/index'
import { App } from './app';


var config = new Modules.Config()
var NSPS: Array<string> = Object.keys(config.namespaces || []);
NSPS.indexOf("") < 0 && NSPS.push("");

var httpConfigs: Array<Modules.IHttpConfig> = config.http || []
var httpsConfigs: Array<Modules.IHttpsConfig> = config.https || []
var servers: Array<Modules.IHttpServerOptions> = []

httpConfigs.forEach(config => {
    let httpApp = new App(NSPS);
    let httpServer = http.createServer(httpApp.express);
    let server: Modules.IHttpServerOptions = {
        port: config.port,
        listenlog: 'listen on http port ' + config.port,
        httpServer: httpServer,
    }
    servers.push(server)
})

httpsConfigs.forEach(config => {
    let httpsApp = new App(NSPS);
    let httpsOptions = {
        key: fs.readFileSync(path.resolve(__dirname, config.key)),
        cert: fs.readFileSync(path.resolve(__dirname, config.cert)),
    };    
    var httpsServer = https.createServer(httpsOptions, httpsApp.express);
    let server: Modules.IHttpServerOptions = {
        port: config.port,
        listenlog: 'listen on https port ' + config.port,
        httpServer: httpsServer,
    }
    servers.push(server)
})

new Modules.Servers(servers)
