import electron = require('electron');
import path = require('path');

export class Main {
    mainWindow: electron.BrowserWindow;
    constructor() {
        this.init();
    }
    destroy() {
        this.uninit();
    }
    init() {
        this.initApp();
    }
    uninit() {

    }

    initApp() {
        electron.app.on('ready', () => {
            this.createMainWindow();
        })
        electron.app.on('window-all-closed', () => {
            // On macOS it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform !== 'darwin') electron.app.quit()
        })        
        electron.app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (this.mainWindow === null) this.createMainWindow()
        })
    }

    createMainWindow(url?: string) {     
        url = url || "http://127.0.0.1:8080/dist/?organization=test&roomid=123";
        this.mainWindow = new electron.BrowserWindow({
            width: 800,
            height: 600,
            // transparent: true,

            // frame: false,
            titleBarStyle: "customButtonsOnHover",
            darkTheme: true,
            autoHideMenuBar: true,
            resizable: true,
            
            webPreferences: {
                nodeIntegration: false,
                webSecurity: false,
                allowRunningInsecureContent: true,
                additionalArguments: ['electron'],                
                preload: path.join(__dirname, 'preload.js')
            }
        })

        this.mainWindow.loadURL(url);

        // this.mainWindow.webContents.openDevTools()

        // Emitted when the window is closed.
        this.mainWindow.on('closed', function () {
          // Dereference the window object, usually you would store windows
          // in an array if your app supports multi windows, this is the time
          // when you should delete the corresponding element.
          this.mainWindow = null
        })        
    }
}