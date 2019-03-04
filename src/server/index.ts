import { Main, IServerOptions } from './main'
import { App } from './app';
import * as fs from 'fs';
import * as path from 'path'
import * as http from 'http'
import * as https from 'https'

interface IHttpConfig {
    port: number
}
interface IHttpsConfig {
    port: number,
    key: string,
    cert: string,
    ca: string
}

var Config = require('./config.json')
var NSPS: Array<string> = Config.namespaces || [];
NSPS.indexOf("") < 0 && NSPS.push("");

var httpConfigs: Array<IHttpConfig> = Config.http || []
var httpsConfigs: Array<IHttpsConfig> = Config.https || []
var servers: Array<IServerOptions> = []

httpConfigs.forEach(config => {
    let httpApp = new App(NSPS);
    let httpServer = http.createServer(httpApp.express);
    let server: IServerOptions = {
        port: config.port,
        namespaces: NSPS,
        listenlog: 'listen on http port ' + config.port,
        httpServer: httpServer,
        socketioServer: null
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
    let server: IServerOptions = {
        port: config.port,
        namespaces: NSPS,
        listenlog: 'listen on https port ' + config.port,
        httpServer: httpsServer,
        socketioServer: null
    }
    servers.push(server)
})


let server = servers[0]
var socketioServer = require('socket.io')(server.httpServer, {
            transports: ['websocket'],
            serveClient: false,
        }) as SocketIO.Server;
server.socketioServer = socketioServer;        

for (let index = 1; index < servers.length; index++) {
    let server = servers[index];
    socketioServer.attach(server.httpServer);
    server.socketioServer = socketioServer;    
}        

new Main(servers)
