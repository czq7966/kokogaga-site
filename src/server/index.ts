import { Main } from './main'
var pkg = require('./package.json')
var nsps: Array<string> = pkg.namespaces || [];
nsps.indexOf("") < 0 && nsps.push("");
new Main(pkg.port || 13670, nsps);
