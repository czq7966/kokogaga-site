import * as express from 'express'
import path = require('path')

export class ExpressApp {
    nsps: Array<string>
    websites: {[name: string]: string}
    express: express.Application;
    constructor(nsps: Array<string>, websites: {[name: string]: string}) {
        this.nsps = nsps || [];
        this.websites = websites || {};
        this.express = express();
        this.routes();
    }
    routes() {
        this.nsps.forEach(key => {
            this.express.use('/' + key, express.static(__dirname + '/../client'));
        })      

        Object.keys(this.websites).forEach(key => {
            let dir = __dirname + this.websites[key];
            this.express.use('/' + key, express.static(dir));
        })              
    }
}