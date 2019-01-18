import * as express from 'express'

export class App {
    express: express.Application;
    constructor() {
        this.express = express();
        this.routes();
    }
    routes() {
        this.express.use('/', express.static(__dirname + '/../client'));
    }
}