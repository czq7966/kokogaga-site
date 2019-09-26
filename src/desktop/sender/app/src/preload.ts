import electron = require('electron')
import fs = require('fs')
import path = require('path')

window.addEventListener('DOMContentLoaded', () => {
    let node = {
        electron: electron,
        process: process,
        fs: fs,
        path: path

    }
    window['Node'] = node;
    console.log("Versions: ", process.versions);
})