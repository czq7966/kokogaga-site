import { Main } from './main'
import { App } from './app';
import * as fs from 'fs';
import * as path from 'path'
import * as http from 'http'
import * as https from 'https'



var Config = require('./config.json')
var NSPS: Array<string> = Config.namespaces || [];
NSPS.indexOf("") < 0 && NSPS.push("");

var httpApp = new App(NSPS);
var httpsApp = new App(NSPS);

var httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, 'keys/server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'keys/server.crt')),
    // requestCert: false
    // rejectUnauthorized: false
};

var httpServer = http.createServer(httpApp.express);
var httpsServer = https.createServer(httpsOptions, httpsApp.express);

new Main(httpServer, Config.http.port, NSPS);
new Main(httpsServer, Config.https.port, NSPS);
