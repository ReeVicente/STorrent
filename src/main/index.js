'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import WebTorrent from 'webtorrent'
import fs from 'fs'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

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

  mainWindow.on('closed', () => {
    mainWindow = null
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

    console.log(torrent)

    // v.client.seed(torrent.files, function (t) {
    //
    // })
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

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
