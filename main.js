const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

// ── Enable WebGPU for WebLLM (must be called before app is ready) ──────────
app.commandLine.appendSwitch('enable-features', 'WebGPU,WebGPUDeveloperFeatures')
app.commandLine.appendSwitch('enable-unsafe-webgpu')
// Allow SharedArrayBuffer (required by WebLLM for WASM threading)
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer')

function createWindow() {
    const win = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'MOKHA FILM Suite',
        icon: path.join(__dirname, 'logo.png.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,  // allows local file:// resources & blob: URLs
            // Required for WebLLM WASM threading
            sharedArrayBuffer: true,
        },
        backgroundColor: '#080808',
        show: false  // wait until ready to show (avoids white flash)
    })

    // Remove default menu bar
    win.setMenuBarVisibility(false)

    // Load the app
    win.loadFile('mokha-suite PRO Vqr.html')

    // Show window once content is ready (no white flash)
    win.once('ready-to-show', () => {
        win.show()
    })

    // Open external links in the default browser, not in Electron
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url)
            return { action: 'deny' }
        }
        return { action: 'allow' }
    })
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
