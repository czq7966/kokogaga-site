import './cmds/index'
import { EventEmitter } from "events";
import * as Modules from './modules'
import * as http from 'http'
import * as https from 'https'

// import { App } from './app'
// var PKG = require('./package.json')
// var NSPS: Array<string> = PKG.namespaces || [];
// NSPS.indexOf("") < 0 && NSPS.push("");
// var Config = require('./config.json')
// var NSPS: Array<string> = Config.namespaces || [];
// NSPS.indexOf("") < 0 && NSPS.push("");



// var app = new App(NSPS);
// var server = http.createServer(app.express);
// var io = require('socket.io')(server, {
//         // upgradeTimeout: 30000
//         transports: ['websocket'],
//         serveClient: false,
//         // pingTimeout:  10000,
//         // pingInterval: 5000,
//         // allowUpgrades: false
//     }) as SocketIO.Server;

export class Main {
    port: number
    namespaces: Array<string>
    eventEmitter: EventEmitter;
    server: http.Server | https.Server;
    socketio: SocketIO.Server;
    constructor(server: http.Server | https.Server, port: number, namespaces: Array<string>) {
        this.server = server;
        this.port = port;
        this.namespaces = namespaces;
        this.eventEmitter = new EventEmitter();
        this.socketio = require('socket.io')(this.server, {
            // upgradeTimeout: 30000
            transports: ['websocket'],
            serveClient: false,
            // pingTimeout:  10000,
            // pingInterval: 5000,
            // allowUpgrades: false
        }) as SocketIO.Server;

        this.initEvents();       
        this.run(); 
    }
    destroy() {
        this.unInitEvents();
        this.close();
        delete this.server;
        delete this.port;
        delete this.eventEmitter;
        delete this.namespaces;
    }

    initEvents() {
        this.namespaces.forEach(name => {
            let nsp = this.socketio.of(name);
            let users = new Modules.SocketUsers(nsp);
        })
    }
    unInitEvents() {

    }
    run() {
        this.server.listen(this.port)
        console.log('lisent on port ' + this.port)        
    }
    close() {
        this.socketio && this.socketio.close();
        this.server && this.server.close();
    }
}
