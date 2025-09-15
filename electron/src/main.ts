const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // durante dev → carrega React no Vite
  win.loadURL("http://localhost:5173");

  // em produção, você vai apontar para build do frontend
  // win.loadFile(path.join(__dirname, "../frontend/index.html"));
}

app.whenReady().then(createWindow);
