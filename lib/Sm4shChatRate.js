'use strict'

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

  return this.queue.length >= 99
}

Sm4shChatRate.prototype.queueReducer = function queueReducer(result, time) {
  if (new Date().valueOf() - time < 30000) {
    result.push(time)
  }
  
  return result
}

module.exports = Sm4shChatRate
