import * as express from 'express'
import * as path from 'path'

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