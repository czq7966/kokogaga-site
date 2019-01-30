import * as express from 'express'

export class App {
    nsps: Array<string>
    express: express.Application;
    constructor(nsps: Array<string>) {
        this.nsps = nsps || [];
        this.express = express();
        this.routes();
    }
    routes() {
        this.nsps.forEach(key => {
            this.express.use('/' + key, express.static(__dirname + '/../client'));
        })        
    }
}