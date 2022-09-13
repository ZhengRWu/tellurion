// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const electron = require('electron');
const Menu = electron.Menu;
const Tray = electron.Tray;
const { dialog } = require('electron')
const ElectronStore = require('electron-store');


ElectronStore.initRenderer();



var loginWindow = null
var upload = null
var mainWindow = null
let appTray = null; // 托盘实例


// 进程间通讯
ipcMain.on("main", async (event, arg) => {
  if (arg === "open_login") {
    loginWindow = new BrowserWindow({
      width: 340,
      height: 453,
      frame: false,
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,  //使支持node接口
        contextIsolation: false,
      }
    })
    loginWindow.loadFile("./res/page/login/login.html")
    // loginWindow.webContents.openDevTools()
  } else if (arg === "close_login") {
    if (loginWindow != null) {
      loginWindow.close()
    }
  } else if (arg === "close_upload") {
    if (upload != null) {
      upload.close()
    }
  } else if (arg === "close_upload_msg") {
    if (upload != null) {
      upload.close()
    }
    mainWindow.webContents.send("renderer-index", "show_up_suc")
  } else if (arg === "close_index") {
    mainWindow.close()
    // mainWindow.maximize()
  } else if (arg === "mini_index") {
    setTray()
  } else if (arg === "open_upload") {
    upload = new BrowserWindow({
      width: 665,
      height: 653,
      frame: false,
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,  //使支持node接口
        contextIsolation: false,
      }
    })
    upload.loadFile("./res/page/upload/upload.html")
    // upload.webContents.openDevTools()
  } else if (arg === "open_selector") {
    var out = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] })
    // console.log(out);
    event.reply("renderer-upload", out)
  }
  // event.reply("renderer-index", "hellow")
})

ipcMain.handle('main', async (event, arg) => {
  if(arg === "open_selector_download"){
    var out = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return out
  }
})


function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 599,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,  //使支持node接口
      contextIsolation: false,
      nodeIntegrationInWorker:true
      // enableRemoteModule: true
    }
  })


  // require('@electron/remote/main').initialize()
  // require("@electron/remote/main").enable(mainWindow.webContents)

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  const server_ip = "192.168.0.145"
  const socket_server_port = "3000"
  const index = 1
  const target = "E:\\Project List\\electron\\t1"
  const file_name = "ndvi_all.zip"



  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        frame: false,
        fullscreenable: false,
        backgroundColor: 'black',
        webPreferences: {
          preload: 'my-child-window-preload-script.js'
        }
      }
    }
    // return { action: 'deny' }
  })

  mainWindow.on('close', function (event) {
    if (loginWindow != null) {
      loginWindow.close()
    } else if (upload != null) {
      try {
        upload.close()
      } catch { }
    }
  })
}

// 隐藏主窗口，并创建托盘
function setTray() {
  // 当托盘最小化时，右击有一个菜单显示，这里进设置一个退出的菜单
  let trayMenuTemplate = [{ // 系统托盘图标目录
    label: '退出',
    click: function () {
      app.quit(); // 点击之后退出应用
    }
  }];
  // 创建托盘实例
  let iconPath = path.join(__dirname, './app.png');
  appTray = new Tray(iconPath);
  // 图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  // 隐藏主窗口
  mainWindow.hide();
  // 设置托盘悬浮提示
  appTray.setToolTip('Tellurion');
  // 设置托盘菜单
  appTray.setContextMenu(contextMenu);
  // 单机托盘小图标显示应用
  appTray.on('click', function () {
    // 显示主程序
    mainWindow.show();
    // 关闭托盘显示
    appTray.destroy();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
