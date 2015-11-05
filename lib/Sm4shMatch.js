'use strict'

function Sm4shMatch(options) {
  options = options || {}

  this.createdAt = options.createdAt || new Date().valueOf()
  this.challenger = options.challenger
  this.wins = options.wins || 0
  this.losses = options.losses || 0
  this.isForfeited = options.isForfeited || false
  this.firstTo = options.firstTo || 3
}

Sm4shMatch.prototype.registerWin = function registerWin() {
  ++this.wins

  return this.checkRecord()
}

Sm4shMatch.prototype.registerLoss = function registerLoss() {
  ++this.losses

  return this.checkRecord()
}

Sm4shMatch.prototype.registerForfeit = function registerForfeit() {
  this.isForfeited = true
}

Sm4shMatch.prototype.checkRecord = function checkRecord() {
  return this.wins === this.firstTo || this.losses === this.firstTo
}

module.exports = Sm4shMatch
