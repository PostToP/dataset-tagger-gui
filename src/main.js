const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('src/index.html')
}

ipcMain.handle('read-database', async () => {
    return readDatabase()
})

ipcMain.handle('write-database', async (_, data) => {
    writeDatabase(data)
})

function readDatabase() {
    try {
        const appPath = app.getAppPath()
        const filePath = path.join(appPath, 'data.json')

        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]')
        }

        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error reading database file:', error)
        return {}
    }
}

function writeDatabase(data) {
    try {
        const appPath = app.getAppPath()
        const filePath = path.join(appPath, 'data.json')
        fs.writeFileSync
            (filePath, JSON.stringify(data, null, 2))
    }
    catch (error) {
        console.error('Error writing database file:', error)
    }
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})