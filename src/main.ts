import { EventEmitter } from "events";
import { SocketUser } from "./user";

var Server = require('socket.io');
var io = new Server() as SocketIO.Server;

export class Main {
    eventEmitter: EventEmitter;
    constructor() {
        this.eventEmitter = new EventEmitter();
        this.initEvents();        
    }

    initEvents() {
        io.on('connect', (socket: SocketIO.Socket) => {
            new SocketUser(io, socket)
        })
        var port = 3000;
        console.log('lisent on port ' + port)
        io.listen(port)        
    }
}
