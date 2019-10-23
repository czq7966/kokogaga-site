import electron = require('electron')
import fs = require('fs')
import path = require('path')
import robotjs = require('robotjs')

window['mynode'] =  {
    electron: electron,
    process: process,
    fs: fs,
    path: path,
    robotjs: robotjs
};

window.addEventListener('DOMContentLoaded', () => {
    console.log("Versions: ", process.versions);
})