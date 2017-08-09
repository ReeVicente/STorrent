<template>
  <div id="wrapper">

    <main>
      <div class="left-side">
        <div class="sidebar">
          <div class="title">
            <h1>STorrent</h1>
          </div>
          <div class="sidebar-content">
            <div class="menu-item">
              <i class="fa fa-download"></i>&nbsp Todos os arquivos
            </div>
            <div class="menu-item">
              <i class="fa fa-play-circle"></i>&nbsp Mídias
            </div>
          </div>
        </div>
      </div>

      <div class="right-side">
        <div class="torrent-buttons-bar">
          <button class="button button-outline" @click="showModal = true"><i class="fa fa-magnet"></i> Magnet</button>
          <button class="button button-outline" @click="openTorrent()"><i class="fa fa-plus"></i> Torrent</button>
        </div>
        <div class="container">
          <div class="torrent-client">
            <table>
            <thead>
              <tr>
                <th><input type="checkbox"></th>
                <th>Name</th>
                <th>State</th>
                <th>Size</th>
                <th>V. Up</th>
                <th>V. D</th>
                <th>MTE</th>
                <th>Peers</th>
              </tr>
            </thead>
            <tbody>

              <tr v-for="(torrent, index) in torrents" @contextmenu="openMenu(index)">
                <td><input type="checkbox" v-model="torrent.checked"></td>
                <td>{{torrent.name}}</td>
                <td>
                  <div class="progress-bar">
                    <div class="text">
                      Baixando {{(torrent.progress * 100).toFixed(1)}}%
                    </div>
                    <div class="progress" v-bind:style="{width: (torrent.progress * 100).toFixed(1) + '%'}">
                    </div>
                  </div>
                </td>
                <td>{{prettyBytes(torrent.length)}}</td>
                <td>{{prettyBytes(torrent.uploadSpeed) + '/s'}}</td>
                <td>{{prettyBytes(torrent.downloadSpeed) + '/s'}}</td>
                <td>{{parseTimeRemaining(torrent.timeRemaining)}}</td>
                <td>{{torrent.numPeers}}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </main>

    <context-menu id="context-menu" ref="ctxMenu">
      <li @click='pause()'>Pausar</li>
      <li @click='remove()'>Remover</li>
      <li @click='removeWithData()'>Remover torrent + dados</li>
      <li>Copiar link magnetico</li>
    </context-menu>

    <modal v-if="showModal" @close="showModal = false" @confirm="openMagnetic(link)">
    <!--
      you can use custom content here to overwrite
      default content
    -->
    <h3 slot="header">Link magnetico</h3>
    <div slot="body">
      Por favor, insira o link magnetico abaixo
      <input type="text" class="magnetic-input" v-model="link">
    </div>
  </modal>
  </div>
</template>

<script>
  import SystemInformation from './LandingPage/SystemInformation'
  import Modal from './Modal/Modal'
  import WebTorrent from 'webtorrent'
  import dragDrop from 'drag-drop'
  import moment from 'moment'
  import contextMenu from 'vue-context-menu'

  import {EventEmitter} from 'events'
  import {remote, ipcRenderer} from 'electron'
  // import lodash from 'lodash'

  var getTorrents = remote.getGlobal('getTorrents')

  EventEmitter.defaultMaxListeners = 0

  export default {
    name: 'landing-page',
    data: function () {
      return {
        torrents: [],
        client: new WebTorrent(),
        showModal: false,
        openContextMenu: false,
        contextIndex: 0
      }
    },
    components: {
      SystemInformation,
      Modal,
      contextMenu
    },
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      },
      openMenu (index) {
        this.$refs.ctxMenu.open()
        this.contextIndex = index
        console.log(this.contextIndex)
      },
      pause () {
        ipcRenderer.send('pause', this.contextIndex)
      },
      remove () {
        ipcRenderer.send('remove', this.contextIndex)
      },
      removeWithData () {
        ipcRenderer.send('removeWithData', this.contextIndex)
      },
      parseTimeRemaining (time) {
        var remaining = moment.duration(time / 1000, 'seconds').humanize()
        remaining = remaining[0].toUpperCase() + remaining.substring(1) + ' remaining.'
        return remaining
      },

      // Human readable bytes util
      // Created By WebTorrents
      prettyBytes (num) {
        var exponent
        var unit
        var neg = num < 0
        var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        if (neg) num = -num
        if (num < 1) return (neg ? '-' : '') + num + ' B'
        exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
        num = Number((num / Math.pow(1000, exponent)).toFixed(2))
        unit = units[exponent]
        return (neg ? '-' : '') + num + ' ' + unit
      },
      addTorrent: function (t, dir, type) {
        ipcRenderer.send('addTorrent', {torrent: t, dir: dir, type: type})
      },
      openMagnetic: function (link) {
        var v = this
        v.showModal = false
        var dir = remote.dialog.showOpenDialog({properties: ['openDirectory']})
        // console.log(dir)
        v.addTorrent(link, dir[0], 2)
      },
      openTorrent: function () {
        var file = remote.dialog.showOpenDialog({
          filters: [
            {name: 'Torrent', extensions: ['torrent']}
          ]
        })
        var dir = remote.dialog.showOpenDialog({properties: ['openDirectory']})
        this.addTorrent(file[0], dir[0], 1)
      }
    },
    created: function () {
      var v = this

      // Get torrents
      setInterval(() => {
        v.torrents = getTorrents()
        // console.log(getTorrents())
      }, 1000)

      // Enable DragDrop
      dragDrop('body', function (files) {
        var dir = remote.dialog.showOpenDialog({properties: ['openDirectory']})
        v.addTorrent(files[0].path, dir[0], 1)
      })

      // Sintel, a free, Creative Commons movie
      // var magnetURI = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent'
      // v.torrents = client.torrents
      // client.add(magnetURI, { path: './' }, function (torrent) {
      //   console.log('Client is downloading:', torrent.infoHash)
      //
      //   torrent.on('done', function () {
      //     console.log('torrent download finished')
      //   })
      //
      //   v.torrents = client.torrents
      // })
    }

  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Source Sans Pro', sans-serif; }
  .button.button-outline{
    color: #0D47A1;
    border-color: #0D47A1;
  }

  .button{
    background: #0D47A1;
    color: #0D47A1;
  }

  .sidebar{
    background: #0D47A1;
    width: 25vw;
    height: 100vh;
    color: white;
  }

  .sidebar .title{
    height: 60px;
    background: #051e44;
  }


  .sidebar .title h1{
    height: 60px;
    line-height: 40px;
    font-size: 1.8em;
    margin: 0;
  }

  .sidebar .title h1,
  .sidebar .menu-item{
    padding: 10px 30px;
  }

  .sidebar .menu-item:hover{
    background: #051e44;
  }

  #context-menu li {
    font-size: 16px;
    padding-left: 15px;
  }

  #context-menu li:hover{
    background: #f4f4f4;
  }

  #wrapper {
    background: #f4f4f4;
    height: 100vh;
    width: 100vw;
  }

  #logo {
    height: auto;
    margin-bottom: 20px;
    width: 420px;
  }

  main {
    display: flex;
    justify-content: space-between;
  }

  table input[type='checkbox']{
    transform: translateY(43%);
  }

  table tbody tr:hover{
    background: #d3d3d3;
  }

  .container{
    padding: 10px 10px;
  }

  .left-side {
    display: flex;
    flex-direction: column;
  }

  .right-side {
    width: 75vw;
  }

  .progress-bar{
    width: 200px;
    color: white;
    height: 30px;
    position: relative;
    background-color: grey;
  }
  .progress-bar .progress{
    background: #0D47A1;
    width: 100%;
    height: 100%;
    text-align: center;

  }
  .progress-bar .text{
    z-index: 5;
    position: absolute;
    text-align: center;
    height: 100%;
    line-height: 30px;
    width: 100%;
  }

  .torrent-buttons-bar{
    height: 60px;
    line-height: 40px;
    background: white;
    padding: 10px 10px;
  }
  .torrent-buttons-bar .button{
    width: 40px;
    padding: 0 10px;
    width: auto;

  }
  .torrent-client{
    height: 70vh;
  }

  .welcome {
    color: #555;
    font-size: 23px;
    margin-bottom: 10px;
  }

  .doc p {
    color: black;
    margin-bottom: 10px;
  }

  .doc button {
    font-size: .8em;
    cursor: pointer;
    outline: none;
    padding: 0.75em 2em;
    border-radius: 2em;
    display: inline-block;
    color: #fff;
    background-color: #4fc08d;
    transition: all 0.15s ease;
    box-sizing: border-box;
    border: 1px solid #4fc08d;
  }

  .doc button.alt {
    color: #42b983;
    background-color: transparent;
  }
</style>
