const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('janela', {
  minimizar: () => ipcRenderer.send('janela-minimizar'),
  maximizar: () => ipcRenderer.send('janela-maximizar'),
  fechar:    () => ipcRenderer.send('janela-fechar')
})
