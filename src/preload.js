const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    readDatabase: () => ipcRenderer.invoke('read-database'),
    writeDatabase: (data) => ipcRenderer.invoke('write-database', data)
})