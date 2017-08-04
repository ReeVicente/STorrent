<template>
  <div id="wrapper">

    <main>
      <div class="left-side">
        <div class="sidebar">
          <span class="title">
            <!-- Welcome to your new project! -->
          </span>

        </div>
      </div>

      <div class="right-side">
        <div class="torrent-buttons-bar">
          <button class="button button-outline" @click="showModal = true"><i class="fa fa-magnet"></i> Magnet</button>
          <button class="button button-outline"><i class="fa fa-plus"></i> Torrent</button>
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

              <tr v-for="torrent in client.torrents">
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
    <modal v-if="showModal" @close="openMagnetic(link)">
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

  var Client = require('bittorrent-tracker')

  var requiredOpts = {
    infoHash: new Buffer('012345678901234567890'), // hex string or Buffer
    peerId: new Buffer('01234567890123456789'), // hex string or Buffer
    announce: [], // list of tracker server urls
    port: 6881 // torrent client port, (in browser, optional)
  }

  import {remote} from 'electron'

  export default {
    name: 'landing-page',
    data: function () {
      return {
        torrents: [
          {
            id: null
          }
        ],
        showModal: false
      }
    },
    components: {
      SystemInformation,
      Modal
    },
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
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
      addTorrent: function (t, dir) {
        var v = this
        v.client.add(t, { path: dir }, function (torrent) {
          console.log('Client is downloading:', torrent.infoHash)
          torrent.on('done', function () {
            console.log('torrent download finished')
          })

          torrent.on('error', function (err) {
            console.log(err)
          })
          // v.client.seed(torrent.files, function (t) {
          //
          // })
        })
      },
      openMagnetic: function (link) {
        var v = this
        v.showModal = false
        var dir = remote.dialog.showOpenDialog({properties: ['openDirectory']})
        // console.log(dir)
        v.addTorrent(link, dir[0])
      }
    },
    created: function () {
      var v = this

      dragDrop('body', function (files) {
        var dir = remote.dialog.showOpenDialog({properties: ['openDirectory']})
        console.log(dir)

        v.addTorrent(files[0], dir[0])
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

  table tr:hover{
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

  .modal-mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, .5);
    display: table;
    transition: opacity .3s ease;
  }

  .modal-wrapper {
    display: table-cell;
    vertical-align: middle;
  }

  .modal-container {
    width: 600px;
    margin: 0px auto;
    padding: 20px 30px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
    transition: all .3s ease;
    font-family: Helvetica, Arial, sans-serif;
  }



  .welcome {
    color: #555;
    font-size: 23px;
    margin-bottom: 10px;
  }

  .title {
    color: #2c3e50;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 6px;
  }

  .title.alt {
    font-size: 18px;
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
