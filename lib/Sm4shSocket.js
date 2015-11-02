'use strict'

const http = require('http')
const socketio = require('socket.io')

function Sm4shSocket(options) {
  options = options || {}

  this.client = options.client

  this.server = http.createServer(this.serverHandler)
  this.io = socketio(this.server)

  this.connectionHandler = this._connectionHandler.bind(this)
  this.onHandler = this._onHandler.bind(this)

  this.on('connection', this.connectionHandler)
}

Sm4shSocket.prototype.serverHandler = function serverHandler(
  request
, response
) {
  response.writeHead(200)
  response.end()
}

Sm4shSocket.prototype.listen = function listen(port) {
  this.server.listen(port || 8080)
}

Sm4shSocket.prototype.on = function on(event, handler) {
  this.io.on(event, handler.bind(this))
}

Sm4shSocket.prototype._connectionHandler = function _connectionHandler(socket) {
  socket.on('on', this.onHandler)
}

Sm4shSocket.prototype._onHandler = function _onHandler(data) {
  console.log('got em', this.client._sb.channels[data.channel])
  this.client.activate(this.client._sb.channels[data.channel])
}

module.exports = Sm4shSocket
