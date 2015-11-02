'use strict'

function Sm4shChallenger(options) {
  options = options || {}

  this.createdAt = options.createdAt || new Date()
  this.username = options.username
  this.nnid = options.nnid
  this.ingameName = options.ingameName
  this.isSubscriber = options.isSubscriber
}

module.exports = Sm4shChallenger
