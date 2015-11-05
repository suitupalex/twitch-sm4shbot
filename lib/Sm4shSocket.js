'use strict'

const http = require('http')
const socketio = require('socket.io')

function Sm4shSocket(options) {
  options = options || {}

  this.client = options.client
  this.sb = this.client._sb
  this.channels = this.sb.channels

  this.server = http.createServer(this.serverHandler)
  this.io = socketio(this.server)

  this.connectionHandler = this._connectionHandler.bind(this)
  this.joinHandler = this._joinHandler.bind(this)
  this.onHandler = this._onHandler.bind(this)
  this.offHandler = this._offHandler.bind(this)
  this.setHandler = this._setHandler.bind(this)
  this.openHandler = this._openHandler.bind(this)
  this.closeHandler = this._closeHandler.bind(this)
  this.clearHandler = this._clearHandler.bind(this)
  this.addHandler = this._addHandler.bind(this)
  this.removeHandler = this._removeHandler.bind(this)
  this.startHandler = this._startHandler.bind(this)
  this.forfeitHandler = this._forfeitHandler.bind(this)
  this.winHandler = this._winHandler.bind(this)
  this.lossHandler = this._lossHandler.bind(this)
  this.trustHandler = this._trustHandler.bind(this)
  this.distrustHandler = this._distrustHandler.bind(this)

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

Sm4shSocket.prototype.update = function update(data) {
  this.io.emit('update', data)
}

Sm4shSocket.prototype.on = function on(event, handler) {
  this.io.on(event, handler.bind(this))
}

Sm4shSocket.prototype._connectionHandler = function _connectionHandler(socket) {
  socket.on('join', this.joinHandler)
  socket.on('on', this.onHandler)
  socket.on('off', this.offHandler)
  socket.on('set', this.setHandler)
  socket.on('open', this.openHandler)
  socket.on('close', this.closeHandler)
  socket.on('clear', this.clearHandler)
  socket.on('add', this.addHandler)
  socket.on('remove', this.removeHandler)
  socket.on('start', this.startHandler)
  socket.on('forfeit', this.forfeitHandler)
  socket.on('win', this.winHandler)
  socket.on('loss', this.lossHandler)
  socket.on('trust', this.trustHandler)
  socket.on('distrust', this.distrustHandler)
}

Sm4shSocket.prototype._joinHandler = function _joinHandler(channel) {
  this.client.join(channel)
}

Sm4shSocket.prototype._onHandler = function _onHandler(data) {
  this.client.activate(this.channels[data.channel])
}

Sm4shSocket.prototype._offHandler = function _offHandler(data) {
  this.client.deactivate(this.channels[data.channel])
}

Sm4shSocket.prototype._setHandler = function _setHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.set(channel, [data.variable, data.value])
}

Sm4shSocket.prototype._trustHandler = function _trustHandler(data) {
  this.client.trust(this.channels[data.channel], data.username)
}

Sm4shSocket.prototype._distrustHandler = function _distrustHandler(data) {
  this.client.distrust(this.channels[data.channel], data.username)
}

Sm4shSocket.prototype._openHandler = function _openHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.open(channel, [data.subs])
}

Sm4shSocket.prototype._closeHandler = function _closeHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.close(channel)
}

Sm4shSocket.prototype._clearHandler = function _clearHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.clear(channel)
}

Sm4shSocket.prototype._addHandler = function _addHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.add(
    channel
  , [data.isSubscriber, data.username, data.nnid, data.ingameName]
  , true
  )
}

Sm4shSocket.prototype._removeHandler = function _removeHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.remove(channel, [data.username])
}

Sm4shSocket.prototype._startHandler = function _startHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.start(channel)
}

Sm4shSocket.prototype._forfeitHandler = function _forfeitHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.forfeit(channel)
}

Sm4shSocket.prototype._winHandler = function _winHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.win(channel)
}

Sm4shSocket.prototype._lossHandler = function _lossHandler(data) {
  const channel = this.channels[data.channel]

  if (!channel.active) {
    return
  }

  this.client.loss(channel)
}

module.exports = Sm4shSocket
