const { app, BrowserWindow, Notification } = require('electron');
const fs = require('fs');
const path = require('path');
const process = require('child_process').spawn;
const portfinder = require('detect-port');
let io, window, apiProcess, loadURL;

app.on('ready', () => {
    portfinder(8000, (error, port) => {
        startSocketApiBridge(port);
    });
});

function startSocketApiBridge(port) {
    io = require('socket.io')(port);
    startAspCoreBackend(port);
    
    io.on('connection', (socket) => {
        console.log('ASP.NET Core Application connected...');

        socket.on('createBrowserWindow', (options) => {
            console.log(options);
            options.show = true;

            window = new BrowserWindow(options);
            window.loadURL(loadURL);

            window.on('closed', function () {
                mainWindow = null;
                apiProcess = null;
            });
        });

        socket.on('createNotification', (options) => {
            const notification = new Notification(options);
            notification.show();
        });
    });
}

function startAspCoreBackend(electronPort) {
    portfinder(8000, (error, electronWebPort) => {
        loadURL = `http://localhost:${electronWebPort}`
        const arguments = [`/electronPort=${electronPort}`, `/electronWebPort=${electronWebPort}`];

        var binPath = path.join(__dirname, 'bin');
        fs.readdir(binPath, (error, files) => {
            const exeFiles = files.filter((name) => name.indexOf('.exe') > -1);
            const exeFileName = exeFiles[0];
            const apipath = path.join(binPath, exeFileName);
            apiProcess = process(apipath, arguments);
    
            apiProcess.stdout.on('data', (data) => {
                var text = data.toString();
                console.log(`stdout: ${data.toString()}`);
            });
        });
    });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});