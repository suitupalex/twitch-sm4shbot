'use strict'

const async = require('async')
const redis = require('redis')

const Sm4shClient = require('./lib/Sm4shClient')
const Sm4shSocket = require('./lib/Sm4shSocket')
const Sm4shChannel = require('./lib/Sm4shChannel')
const Sm4shMatch = require('./lib/Sm4shMatch')
const Sm4shChallenger = require('./lib/Sm4shChallenger')

const store = redis.createClient()

store.smembers('_sb-channels', function handleChannels(error, channels) {
  channels = channels || []

  const channelHandlers = {}
  const length = channels.length
  for (let i = 0; i < length; i++) {
    const channelName = channels[i]
    channelHandlers[channelName] = function handleChannel(cb) {
      function handleChannelDatum(error, data) {
        if (error) {
          throw error
        }

        if (!data) {
          return cb(null, null)
        }

        data = JSON.parse(data)

        if (data.matches) {
          data.matches = data.matches.map(function matchesMapper(match) {
            return new Sm4shMatch(match)
          })
        }

        if (data.queue) {
          data.queue = data.queue.map(function queueMapper(challenger) {
            return [
              challenger[0]
            , new Sm4shChallenger(challenger)
            ]
          })

          data.queue = new Map(data.queue)
        }

        return cb(null, new Sm4shChannel(data))
      }

      store.get(`_sb-channel-${channelName}`, handleChannelDatum)
    }
  }

  function handleChannelData(error, rawChannelData) {
    function channelReducer(result, channel) {
      const data = rawChannelData[channel]
      if (data) {
        result[channel] = data
      }

      return result
    }

    const keys = Object.keys(rawChannelData)
    const channelData = keys.reduce(channelReducer, {})

    const client = new Sm4shClient({
      channels: channels
    , _sb: {
        store: store
      , channels: channelData
      }
    })

    const socket = new Sm4shSocket({
      client: client
    })

    client.socket = socket

    client.connect()
    socket.listen(process.env.PORT)
  }

  async.parallel(channelHandlers, handleChannelData)
})
