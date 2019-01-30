import './cmds/index'
import { EventEmitter } from "events";
import * as http from 'http'
import { App } from './app'
import * as Modules from './modules'

var PKG = require('./package.json')
var NSPS: Array<string> = PKG.namespaces || [];
NSPS.indexOf("") < 0 && NSPS.push("");


var app = new App(NSPS);
var server = http.createServer(app.express);
var io = require('socket.io')(server, {
        // upgradeTimeout: 30000
        transports: ['websocket'],
        serveClient: false,
        // pingTimeout:  10000,
        // pingInterval: 5000,
        // allowUpgrades: false
    }) as SocketIO.Server;

export class Main {
    port: number
    namespaces: Array<string>
    eventEmitter: EventEmitter;
    constructor(port?: number, namespaces?: Array<string>) {
        this.port = port || PKG.port || 13670;
        this.namespaces = namespaces || NSPS
        this.eventEmitter = new EventEmitter();
        this.initEvents();       
        this.run(); 
    }

    initEvents() {
        this.namespaces.forEach(name => {
            let nsp = io.of(name);
            let users = new Modules.SocketUsers(nsp);
        })
    }
    run() {
        server.listen(this.port)
        console.log('lisent on port ' + this.port)        
    }
}
