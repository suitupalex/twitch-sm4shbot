'use strict'

const Sm4shChallenger = require('./Sm4shChallenger')
const Sm4shMatch = require('./Sm4shMatch')

function Sm4shChannel(options) {
  options = options || {}

  this.name = options.name
  this.active = options.active || false
  this.open = options.open || false
  this.subsOnly = options.subsOnly || false
  this.queue = options.queue || new Map()
  this.limit = options.limit || 20
  this.firstTo = options.firstTo || 2
  this.firstToSub = options.firstToSub || 3
  this.matches = options.matches || []
  this.currentChallenger = null
  this.currentMatch = null
  this.trusted = options.trusted || {}
}

Sm4shChannel.prototype.trust = function trust(username) {
  this.trusted[username] = 'admin'
}

Sm4shChannel.prototype.distrust = function distrust(username) {
  delete this.trusted[username]
}

Sm4shChannel.prototype.push = function push(challenger) {
  const queue = this.queue
  const username = challenger.username

  if (queue.has(username)) {
    return false
  }

  this.queue.set(username, new Sm4shChallenger(challenger))

  return true
}

Sm4shChannel.prototype.shift = function shift() {
  const queue = this.queue
  
  if (queue.size === 0) {
    this.currentChallenger = null
    return this.currentMatch = null
  }
  
  const challenger = this.currentChallenger = queue.values().next().value
  queue.delete(challenger.username)

  this.currentMatch = new Sm4shMatch({
    challenger: challenger
  , firstTo: challenger.isSubscriber ? this.firstToSub : this.firstTo
  })
  this.matches.push(this.currentMatch)

  return this.currentMatch
}

Sm4shChannel.prototype.remove = function remove(username) {
  const queue = this.queue

  if (queue.size === 0) {
    return false
  }

  if (!queue.has(username)) {
    return false
  }

  queue.delete(username)

  return true
}

Sm4shChannel.prototype.registerWin = function registerWin() {
  if (!this.currentMatch.registerWin()) {
    return false
  }

  this.endMatch()

  return true
}

Sm4shChannel.prototype.registerLoss = function registerLoss() {
  if (!this.currentMatch.registerLoss()) {
    return false
  }

  this.endMatch()

  return true
}

Sm4shChannel.prototype.registerForfeit = function registerForfeit() {
  this.currentMatch.registerForfeit()
  this.endMatch()
}

Sm4shChannel.prototype.endMatch = function endMatch() {
  this.currentMatch = null
  this.currentChallenger = null
}

module.exports = Sm4shChannel
