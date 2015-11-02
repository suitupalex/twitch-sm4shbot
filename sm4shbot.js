'use strict'

const Sm4shClient = require('./lib/Sm4shClient')
const Sm4shSocket = require('./lib/Sm4shSocket')

const client = new Sm4shClient({
  channels: ['#suitupalex']
})

const socket = new Sm4shSocket({
  client: client
})

client.connect()
socket.listen(process.env.PORT)
