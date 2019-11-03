const fs = require('fs')

var defaultPackageFile = "./package.json";
var defaultConfigFile = "./config.json"
var packageNamePrefix = "--package-name=";
var configFilePrefix = "--config-file=";
var packageName;
var configFile;

process.argv.forEach(arg => {
    if (arg.indexOf(packageNamePrefix) == 0) {
        packageName = arg.substr(packageNamePrefix.length);
        if (packageName && packageName[0]=="'" && packageName[packageName.length - 1] == "'") {
            packageName = packageName.substr(1, packageName.length - 2);
        }
    }
    if (arg.indexOf(configFilePrefix) == 0) {
        configFile = arg.substr(configFilePrefix.length);
        if (configFile && configFile[0]=="'" && configFile[configFile.length - 1] == "'") {
            configFile = configFile.substr(1, configFile.length - 2);
        }        
    }    
})

function changePackageName(name) {
    if (name) {
        var packageMsg = JSON.parse(fs.readFileSync(defaultPackageFile));
        packageMsg["name"] = name;
        fs.writeFileSync(defaultPackageFile, JSON.stringify(packageMsg, undefined, "\t"))
    } else {
        throw "package name is null";
    }
}

function changeConfigFile(fileName) {
    var configMsg = JSON.parse(fs.readFileSync(fileName));
    fs.writeFileSync(defaultConfigFile, JSON.stringify(configMsg, undefined, "\t"))
}

if (packageName) {
    changePackageName(packageName);
}
if (configFile) {
    changeConfigFile(configFile);
}


