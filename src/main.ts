import { EventEmitter } from "events";
import { SocketUser } from "./user";

var Server = require('socket.io');
var io = new Server() as SocketIO.Server;

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
        io.listen(this.port)     
    }
}
