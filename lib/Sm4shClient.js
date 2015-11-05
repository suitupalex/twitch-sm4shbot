'use strict'

const debug = require('debug')
const Client = require('tmi.js').client

const Sm4shChannel = require('./Sm4shChannel')
const Sm4shChatRate = require('./Sm4shChatRate')

const environment = process.env.NODE_ENV
const username = process.env.SB_USERNAME
const password = process.env.SB_PASSWORD
const rateCheckInterval = process.env.SB_RATE_CHECK_INTERVAL || 3000
const socketUpdateInterval = process.env.SB_SOCKET_UPDATE_INTERVAL || 250
const myChannel = `#${username}`

function Sm4shClient(config) {
  if (!username || !password) {
    throw new Error('Missing credentials.')
  }

  config = config || {}

  config.options = config.options || {debug: environment === 'development'}
  config.identity = config.identity || {username: username, password: password}
  config.channels = config.channels || []
  config.channels.unshift('#jtv', myChannel)
  config.logger = {
    info: debug('sb:info:tmi')
  , warn: debug('sb:warn:tmi')
  , error: debug('sb:error:tmi')
  }

  Client.call(this, config)

  this._sb = {
    // Use an object because we care more about speed than memory.
    channels: {}
  }

  this.handleJoin = this._handleJoin.bind(this)
  this.handleChat = this._handleChat.bind(this)
  this.logRate = this._logRate.bind(this)
  this.updateSocket = this._updateSocket.bind(this)

  this.chatRate = new Sm4shChatRate()
  this.rateLogger = setInterval(this.logRate, rateCheckInterval)
  this.lastListTime = 0

  this.socket = null
  this.socketUpdater = setInterval(this.updateSocket, socketUpdateInterval)

  this.on('join', this.handleJoin)
  this.on('chat', this.handleChat)
}

Sm4shClient.prototype = Object.create(Client.prototype)
Sm4shClient.prototype.constructor = Sm4shClient

Sm4shClient.prototype.sayAll = function sayAll(message) {
  const self = this

  self.channels.forEach(function channelIterator(channel) {
    self.say(channel, message)
  })
}

Sm4shClient.prototype.say = function say(channel, message, warn, to, everyone) {
  if (this.chatRate.push()) {
    this.log.warn(`Cannot send message, we are at the rate limit.`)
    return null
  }

  const channelname = channel.name

  message = everyone ? message : `@${to ? to : channelname}, ${message}`

  return Client.prototype.say.call(
    this
  , channelname
  , `${warn ? 'ItsBoshyTime' : ''} ${message}`
  )
}

Sm4shClient.prototype.activate = function activate(channel) {
  if (channel.active) {
    return this.say(channel, 'Sm4shbot is already active!')
  }

  channel.active = true

  return this.say(
    channel
  , 'Sm4shbot has been activated. Happy sm4shing! MrDestructoid'
  )
}

Sm4shClient.prototype.deactivate = function deactivate(channel) {
  if (!channel.active) {
    return this.say(
      channel, 'Sm4shbot is already deactivated.', true
    )
  }

  channel.active = false

  return this.say(channel, 'Sm4shbot has been deactivated.')
}

Sm4shClient.prototype.trust = function trust(channel, args) {
  const username = args[0]
  channel.trust(username)

  return this.say(channel, `@${username} is now an admin.`)
}

Sm4shClient.prototype.distrust = function distrust(channel, args) {
  const username = args[0]
  channel.distrust(username)

  return this.say(channel, `@${username} is no longer an admin.`)
}

Sm4shClient.prototype.set = function set(channel, args) {
  const variable = args[0]
  var value = args[1]

  if (!variable || !value) {
    return this.say(
      channel, 'Not enough info to set parameter.', true
    )
  }

  switch (variable) {
    case 'firstTo':
    case 'firstto':
    case 'first':
      value = parseInt(value)

      if (isNaN(value)) {
        return this.say(
          channel, 'The value for the first to setting is not a number.', true
        )
      }
      
      channel.firstTo = value
      channel.firstToSub = value

    return this.say(
      channel, `Sets are now first to ${value}.`
    )

    case 'firstToViewer':
    case 'firsttoviewer':
    case 'firstViewer':
    case 'firstviewer':
    case 'fv':
      value = parseInt(value)

      if (isNaN(value)) {
        return this.say(
          channel, 'The value for the first to setting is not a number.', true
        )
      }
      
      channel.firstTo = value

    return this.say(
      channel, `Sets are now first to ${value} for viewers.`
    )

    case 'firstToSub':
    case 'firsttosub':
    case 'firstSub':
    case 'firstsub':
    case 'fs':
      value = parseInt(value)

      if (isNaN(value)) {
        return this.say(
          channel, 'The value for the first to setting is not a number.', true
        )
      }
      
      channel.firstToSub = value

    return this.say(
      channel, `Sets are now first to ${value} for subs.`
    )

    case 'limit':
      value = parseInt(value)

      if (isNaN(value)) {
        return this.say(
          channel, 'The value for the first to setting is not a number.', true
        )
      }
      
      channel.limit = value
    return this.say(
      channel, `Challenger list limit is now ${value}.`
    )
  }
}

Sm4shClient.prototype.open = function open(channel, args) {
  const subs = args[0]

  const oldSubs = channel.subsOnly
  const newSubs = channel.subsOnly =
     subs === true
  || subs === 'true'
  || subs === 'subs'
  || subs === 'subscribers'

  if (channel.open) {
    if (oldSubs !== newSubs) {
      return this.say(
        channel
      , `Subscriber-only mode is now ${newSubs ? 'on' : 'off'}.`
      ) 
    }

    return this.say(channel, 'Challenger list is already open.', true)
  }

  channel.open = true

  return this.say(
    channel
  , `Challenger list has been opened to public entries.
    To enter, type \`!sm4sh enter <NNID> <In-game Name>\`.`
  , false
  , false
  , true
  )
}

Sm4shClient.prototype.close = function close(channel) {
  if (!channel.open) {
    return this.say(channel, 'Challenger list is already closed.', true)
  }

  channel.open = false

  return this.say(
    channel
  , `Challenger list has been closed to public entries.`
  , false
  , false
  , true
  )
}

Sm4shClient.prototype.clear = function clear(channel) {
  if (channel.queue.size === 0) {
    return this.say(channel, 'The challenger list is already empty.', true)
  }

  channel.queue.clear()

  return this.say(
    channel
  , 'The challenger list has been cleared.'
  , false
  , false
  , true
  )
}

Sm4shClient.prototype.add = function add(channel, args, isAdmin) {
  const isSubscriber = args[0]
  const username = args[1]
  const nnid = args[2]
  const ingameName = args.slice(3, args.length).join(' ')

  if (!username || !nnid || !ingameName) {
    return this.say(channel, 'Incomplete registration info!')
  }

  if (!isAdmin && !channel.open) {
    return this.say(channel, 'The challenger list is currently closed.')
  }

  if (!isAdmin && channel.subsOnly && !isSubscriber) {
    return this.say(channel, 'Sorry, only subs can enter right now.', true)
  }

  if (!isAdmin && channel.queue.size >= channel.limit) {
    return this.say(channel, 'Sorry, the list limit has been reached.', true)
  }

  const success = channel.push({
    username: username
  , nnid: nnid
  , ingameName: ingameName
  , isSubscriber: isSubscriber
  })

  if (isAdmin) {
    if (!success) {
      return this.say(channel, `@${username} is already on the list.`, true)
    }

    return this.say(channel, `@${username} has been added to the list.`)
  }

  if (!success) {
    return this.say(channel, `You're already on the list.`, true, username)
  }

  return this.say(channel, `You've been added to the list!`, false, username)
}

Sm4shClient.prototype.remove = function remove(channel, args, isAdmin) {
  const username = args[0]

  const success = channel.remove(username)

  if (isAdmin) {
    if (!success) {
      return this.say(channel, `@${username} is not on the list.`, true)
    }

    return this.say(channel, `@${username} has been removed from the list.`)
  }

  if (!success) {
    return this.say(channel, `You're not yet on the list.`, true, username)
  }

  return this.say(
    channel
  , `You've been removed from the list.`
  , false
  , username
  )
}

Sm4shClient.prototype.list = function list(channel, args) {
  const now = new Date().valueOf()

  if (now - this.lastListTime < 30000) {
    return null
  }

  this.lastListTime = now

  const username = args[0]

  if (channel.queue.size === 0) {
    return this.say(
      channel
    , 'The challenger list is currently empty.'
    , false
    , username
    )
  }

  const challengers = channel.queue.keys()
  var usernames = []

  while (true) {
    const challenger = challengers.next()

    if (challenger.done) {
      break
    }

    usernames.push(`@${challenger.value}`)
  }

  this.log.info(usernames)

  return this.say(
    channel
  , `Current challenger list: ${usernames.join(', ')}`
  , false
  , username
  )
}

Sm4shClient.prototype.next = function next(channel) {
  if (channel.queue.size === 0) {
    return this.say(
      channel
    , 'The challenger list is currently empty.'
    )
  }

  const challenger = channel.queue.entries().next().value[1]

  return this.say(
    channel
  , `Next challenger: ${challenger.username}
    - NNID: ${challenger.nnid}
    - In-Game Name: ${challenger.ingameName}
    - First To:
      ${challenger.isSubscriber ? channel.firstToSubs : channel.firstTo}`
  )
}

Sm4shClient.prototype.start = function start(channel) {
  if (channel.queue.size === 0) {
    return this.say(
      channel
    , 'The challenger list is currently emmpty.'
    )
  }

  if (channel.currentMatch) {
    return this.say(
      channel
    , 'There is already a match in progress.'
    , true
    )
  }

  const match = channel.shift()

  if (!match) {
    return this.say(
      channel
    , 'The challenger list is currently empty.'
    )
  }

  const challenger = match.challenger

  const message = this.say(
    channel
  , `@${challenger.username} is up!
    - NNID: ${challenger.nnid}
    - In-Game Name: ${challenger.ingameName}
    - First To: ${match.firstTo}`
  , false
  , null
  , true
  )

  if (channel.queue.size === 0) {
    return message
  }

  const next = channel.queue.keys().next().value

  return this.say(
    channel
  , `@${next}, start getting ready!`
  , false
  , null
  , true
  )
}

Sm4shClient.prototype.forfeit = function forfeit(channel) {
  if (!channel.currentMatch) {
    return this.say(
      channel
    , 'No match is being played.'
    , true
    )
  }

  const challenger = channel.currentChallenger
  channel.registerForfeit()

  return this.say(
    channel
  , `The match against ${challenger.username} has been forfeited.`
  , true
  )
}

Sm4shClient.prototype.win = function win(channel) {
  if (!channel.currentMatch) {
    return this.say(channel, 'No match is being played.', true)
  }

  const match = channel.currentMatch
  const hasWon = channel.registerWin()
  const score = `${match.wins}-${match.losses}`
  const name = channel.name

  if (hasWon) {
    return this.say(
      channel
    , `KAPOW @${name} wins the match ${score}!`
    , false
    , null
    , true
    )
  }

  return this.say(
    channel
  , `KAPOW @${name} wins the game! The score is now ${score}
    , first to ${match.firstTo}`
  , false
  , null
  , true
  )
}

Sm4shClient.prototype.loss = function loss(channel) {
  if (!channel.currentMatch) {
    return this.say(channel, 'No match is being played.', true)
  }

  const match = channel.currentMatch
  const hasLost = channel.registerLoss()
  const score = `${match.wins}-${match.losses}`
  const name = match.challenger.username

  if (hasLost) {
    return this.say(
      channel
    , `PJSalt @${name} wins the match ${score}!`
    , false
    , null
    , true
    )
  }

  return this.say(
    channel
  , `PJSalt @${name} wins the game! The score is now ${score}
    , first to ${match.firstTo}`
  , false
  , null
  , true
  )
}

Sm4shClient.prototype._logRate = function logRate() {
  this.chatRate.analyze()
  this.log.info('Message Rate:', this.chatRate.queue.length)
}

Sm4shClient.prototype._handleJoin = function _handleJoin(rawChannel, user) {
  if (user !== username) {
    return
  }

  const channels = this._sb.channels
  const channelname = rawChannel.substr(1)
  var channel = channels[channelname]

  if (channel) {
    this.say(
      channel
    , `Sm4shbot has just restarted.
       Happy sm4shing! MrDestructoid`
    , true
    )

    return
  }

  channel = channels[channelname] = new Sm4shChannel({
    name: channelname
  })

  this.say(
    channel
  , `Sm4shbot is currently deactivated.
    Type \`!sm4sh on\` to activate it.`
  , true
  )
}

Sm4shClient.prototype._parseMessage = function(message) {
  const rest = message.substr(7)
  const commandEndIndex = rest.indexOf(' ')
  const command = rest.substr(
    0
  , commandEndIndex > -1 ? commandEndIndex : undefined
  )
  const args = rest
    .substr(commandEndIndex > -1 ? commandEndIndex + 1 : 1)
    .split(' ')

  return {
    command: command
  , args: args
  }
}

Sm4shClient.prototype._handleChat = function _handleChat(
  rawChannel
, rawUser
, message
, isSelf
) {
  const sm4sh = message.substr(0, 7)
  if (
     isSelf
  || !message
  || (sm4sh !== '!sm4sh ' && sm4sh !== '!smash ')
  ) {
    return
  }

  const parsedMessage = this._parseMessage(message)
  const command = parsedMessage.command
  const args = parsedMessage.args
  const channelname = rawChannel.substr(1)
  const username = rawUser['display-name']
  const isSubscriber = rawUser.subscriber

  this.log.info('Incoming command:', channelname, username, command, args)

  const channel = this._sb.channels[channelname]

  if (username === channelname || channel.trusted[username] === 'admin') {
    switch (command) {
      case 'on':
      case 'activate':
        this.activate(channel)
      return

      case 'off':
      case 'deactivate':
        this.deactivate(channel)
      return
    }

    if (!channel.active) {
      this.say(
        channel
      , `Sm4shbot is currently deactivated.
        Type \`!sm4sh on\` to activate it.`
      , true
      )

      return
    }

    switch (command) {
      case 'trust':
        this.trust(channel, args)
      return
      case 'distrust':
        this.distrust(channel, args)
      return
      case 'open':
        this.open(channel, args)
      return
      case 'close':
        this.close(channel)
      return
      case 'set':
        this.set(channel, args)
      return
      case 'clear':
        this.clear(channel)
      return
      case 'add':
        args.unshift(isSubscriber)
        this.add(channel, args, true)
      return
      case 'remove':
      case 'rm':
        this.remove(channel, args, true)
      return
      case 'next':
        this.next(channel)
      return
      case 'start':
      case 's':
        this.start(channel)
      return
      case 'win':
      case 'w':
        this.win(channel)
      return
      case 'loss':
      case 'l':
        this.loss(channel)
      return
      case 'forfeit':
      case 'ff':
        this.forfeit(channel)
      return
    }
  }
    
  if (!channel.active) {
    return
  }

  args.unshift(username)

  switch (command) {
    case 'enter':
    case 'join':
    case 'register':
      args.unshift(isSubscriber)
      this.add(channel, args)
    return
    case 'leave':
    case 'lv':
    case 'drop':
      this.remove(channel, args)
    return
    case 'list':
    case 'ls':
      this.list(channel, args)
    return
  }
}

Sm4shClient.prototype._updateSocket = function _updateSocket() {
  if (!this.socket) {
    return
  }

  const channels = this._sb.channels
  const keys = Object.keys(channels)
  const update = keys.map(function keyMapper(key) {
    const channel = channels[key]

    return {
      name: channel.name
    , active: channel.active
    , open: channel.open
    , subsOnly: channel.subsOnly
    , queue: Array.from(channel.queue)
    , limit: channel.limit
    , firstTo: channel.firstTo
    , firstToSub: channel.firstToSub
    , matches: channel.matches
    , currentChallenger: channel.currentChallenger
    , currentMatch: channel.currentMatch
    , trusted: channel.trusted
    }
  })

  this.log.info('Sending update:', update)
  this.socket.update(update)
}

module.exports = Sm4shClient
