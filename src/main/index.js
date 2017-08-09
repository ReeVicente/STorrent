'use strict'

import { app, BrowserWindow, ipcMain, Menu, Tray } from 'electron'
import WebTorrent from 'webtorrent'
import fs from 'fs'
import rimraf from 'rimraf'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

var tray
let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

global.getTorrents = function () {
  return client.torrents
}

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  var iconpath = '/Users/renan/Code/storrent/icon.png'
  tray = new Tray(iconpath)

  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: function () {
        mainWindow.show()
      }
    },
    {
      label:
      'Quit',
      click: function () {
        app.isQuiting = true
        app.quit()
      }
    }
  ])

  console.log(client.torrents)

  setInterval(function () {
    if (client.torrents.length !== 0 && client.progress !== 0) {
      tray.setToolTip('STorrent [Total Progress: ' + (client.progress * 100).toFixed(1) + '% ]')
    } else {
      tray.setToolTip('STorrent')
    }
  }, 2000)

  tray.setContextMenu(contextMenu)

  // mainWindow.on('closed', () => {
  //   mainWindow = null
  // })

  mainWindow.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault()
      mainWindow.hide()
    }
    return false
  })

  mainWindow.on('show', function () {
    tray.setHighlightMode('always')
  })

  startTorrentManager()
}

function bufferFile (path) {
  return fs.readFileSync(path)
}

var client = new WebTorrent()
function startTorrentManager () {
  ipcMain.on('addTorrent', (event, data) => {
    if (data.type === 1) {
      addTorrent(bufferFile(data.torrent), data.dir)
    } else {
      // if is magnet
      addTorrent(data.torrent, data.dir)
    }
  })

  ipcMain.on('pause', (event, data) => {
    if (client.torrents[data].downloadSpeed !== 0) {
      client.torrents[data].deselect(0, client.torrents[data].pieces.length - 1, false)
    } else {
      client.torrents[data].select(0, client.torrents[data].pieces.length - 1, false)
    }
  })

  ipcMain.on('remove', (event, data) => {
    client.torrents[data].destroy(function () {
      console.log('destroyed')
    })
  })

  ipcMain.on('removeWithData', (event, data) => {
    var path = require('path').join(client.torrents[data].path, client.torrents[data].name)
    console.log(path)
    client.torrents[data].destroy(function () {
      rimraf(path, function () {
      })
    })
  })
}

function addTorrent (t, dir) {
  client.add(t, { path: dir }, function (torrent) {
    console.log('Client is downloading:', torrent.infoHash)
    torrent.on('done', function () {
      console.log('torrent download finished')
    })

    torrent.on('error', function (err) {
      console.log(err)
    })

    tray.setToolTip('STorrent [Total Progress: ' + (client.progress * 100).toFixed(1) + '% ]')

    // v.client.seed(torrent.files, function (t) {
    //
    // })
  })
}

app.on('ready', createWindow)

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
