'use strict'

const Sm4shClient = require('./lib/Sm4shClient')

const client = new Sm4shClient({
  channels: ['#suitupalex']
})

client.connect()
