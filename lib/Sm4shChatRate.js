'use strict'

const CHAT_RATE_LIMIT = parseInt(process.env.SB_CHAT_RATE_LIMIT) || 19

function Sm4shChatRate() {
  this.queue = []
}

Sm4shChatRate.prototype.clear = function clear() {
  this.queue = []
}

Sm4shChatRate.prototype.push = function push() {
  this.queue.push(new Date().valueOf())

  return this.analyze()
}

Sm4shChatRate.prototype.analyze = function analyze() {
  this.queue = this.queue.reduce(this.queueReducer, [])

  return this.queue.length >= CHAT_RATE_LIMIT
}

Sm4shChatRate.prototype.queueReducer = function queueReducer(result, time) {
  if (new Date().valueOf() - time < 30000) {
    result.push(time)
  }
  
  return result
}

module.exports = Sm4shChatRate
