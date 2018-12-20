import { EventEmitter } from "events";
import { SocketUser } from "./user";
import * as http from 'http'
import { App } from './app'


var app = new App();
var server = http.createServer(app.express);
var io = require('socket.io')(server, {
        // upgradeTimeout: 30000
        transports: ['websocket'],
        // pingTimeout:  10000,
        // pingInterval: 5000,
        // allowUpgrades: false
    }) as SocketIO.Server;

export class Main {
    port: number
    eventEmitter: EventEmitter;
    constructor(port: number) {
        this.port = port;
        this.eventEmitter = new EventEmitter();
        this.initEvents();       
        this.run(); 
    }

    initEvents() {
        io.on('connect', (socket: SocketIO.Socket) => {
            new SocketUser(io, socket)
        })
    }
    run() {
        console.log('lisent on port ' + this.port)
        server.listen(this.port)
    }
}
