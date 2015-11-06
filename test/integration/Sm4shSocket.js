'use strict'

const debug = require('debug')('sb:test')
const events = require('events')
const tap = require('tap')

const Sm4shClient = require('../../lib/Sm4shClient')
const Sm4shSocket = require('../../lib/Sm4shSocket')

const KW = '!sm4sh'
const TEST_USERNAME = process.env.SB_USERNAME || 'twitch_sm4shbot'
const TEST_CHANNEL = process.env.SB_USERNAME || 'twitch_sm4shbot'
const TEST_CHALLENGER = process.env.SB_TEST_CHALLENGER || 'challenger'
const TEST_CHALLENGER2 = process.env.SB_TEST_CHALLENGER2 || 'challenger2'
const TEST_CHALLENGER3 = process.env.SB_TEST_CHALLENGER3 || 'challenger3'
const CHAT_RATE_LIMIT = parseInt(process.env.SB_CHAT_RATE_LIMIT) || 19

var client
var server
var socket
var channels
var channel
var queue
var challenger
var match

function socketEmit(message, isSub) {
  const parsedMessage = client._parseMessage(`${KW} ${message}`)
  const command = parsedMessage.command
  const args = parsedMessage.args

  var data = {channel: TEST_CHANNEL}

  switch (command) {
    case 'open':
      data.subs = args[0]
    break
    case 'set':
      data.variable = args[0]
      data.value = args[1]
    break
    case 'add':
      data.isSubscriber = Boolean(isSub)
      data.username = args[0]
      data.nnid = args[1]
      data.ingameName = args.slice(2, args.length).join(' ')
    break
   case 'remove':
      data.username = args[0]
    break
  }

  debug('Capturing event:', command, data)

  socket.emit(command, data)
}

tap.test('should setup mocked client', function mockClientTest(t) {
  Sm4shClient.prototype._sendMessage = function _sendMessage(user, message) {
    debug('Capturing message:', user, message)
    return true
  }

  client = new Sm4shClient()
  channels = client._sb.channels

  t.end()
})

tap.test('should setup mocked socket', function mockSocketTest(t) {
  server = new Sm4shSocket({
    client: client
  })

  socket = new events.EventEmitter()

  server.connectionHandler(socket)

  t.end()
})

tap.test('should join channel', function joinTest(t) {
  client.emit('join', `#${TEST_CHANNEL}`, TEST_USERNAME)

  channel = channels[TEST_CHANNEL]
  queue = channel.queue

  t.ok(channel)

  t.end()
})

tap.test('should not open list', function notOpenTest(t) {
  socketEmit('open')

  t.notOk(channel.open)

  t.end()
})

tap.test('should activate bot', function activateTest(t) {
  socketEmit('on')

  t.ok(channel.active)

  t.end()
})

tap.test('should open list', function openTest(t) {
  socketEmit('open subs')

  t.ok(channel.open)
  t.ok(channel.subsOnly)

  t.end()
})

tap.test('should add a challenger', function addTest(t) {
  socketEmit(`add ${TEST_CHALLENGER} ${TEST_CHALLENGER} TEST CHALLENGER`)

  t.equal(queue.size, 1)
  t.ok(queue.has(TEST_CHALLENGER))

  const challenger = queue.values().next().value

  t.equal(challenger.username, TEST_CHALLENGER)
  t.equal(challenger.nnid, TEST_CHALLENGER)
  t.equal(challenger.ingameName, 'TEST CHALLENGER')

  t.end()
})

tap.test('should start match', function deleteTest(t) {
  socketEmit('start')

  t.equal(queue.size, 0)
  t.equal(channel.matches.length, 1)

  match = channel.currentMatch
  challenger = channel.currentChallenger

  t.ok(match)
  t.ok(challenger)
  t.equal(match.wins, 0)
  t.equal(match.losses, 0)
  t.equal(match.firstTo, 2)

  t.end()
})

tap.test('should register a win', function winTest(t) {
  socketEmit('win')

  t.equal(match.wins, 1)
  t.equal(match.losses, 0)
  t.notOk(match.checkRecord())

  t.end()
})

tap.test('should register a loss', function lossTest(t) {
  socketEmit('loss')

  t.equal(match.wins, 1)
  t.equal(match.losses, 1)
  t.notOk(match.checkRecord())

  t.end()
})

tap.test('should win the match', function matchWinTest(t) {
  socketEmit('win')

  t.equal(match.wins, 2)
  t.equal(match.losses, 1)
  t.ok(match.checkRecord())

  t.notOk(channel.currentMatch)
  t.notOk(channel.currentChallenger)

  t.end()
})

tap.test('should add a challenger', function addTest(t) {
  socketEmit(`add ${TEST_CHALLENGER} ${TEST_CHALLENGER} TEST CHALLENGER`)

  t.equal(queue.size, 1)
  t.ok(queue.has(TEST_CHALLENGER))

  const challenger = queue.values().next().value

  t.equal(challenger.username, TEST_CHALLENGER)
  t.equal(challenger.nnid, TEST_CHALLENGER)
  t.equal(challenger.ingameName, 'TEST CHALLENGER')

  t.end()
})

tap.test('should add a subbed challenger', function addSubTest(t) {
  socketEmit(
    `add ${TEST_CHALLENGER2} ${TEST_CHALLENGER2} TEST2 CHALLENGER2`
  , true
  )

  t.equal(queue.size, 2)
  t.ok(queue.has(TEST_CHALLENGER2))

  const challengers = queue.values()
  challengers.next()
  const challenger = challengers.next().value

  t.equal(challenger.username, TEST_CHALLENGER2)
  t.equal(challenger.nnid, TEST_CHALLENGER2)
  t.equal(challenger.ingameName, 'TEST2 CHALLENGER2')

  t.end()
})

tap.test('should toggle off subs only', function subsOnlyOffTest(t) {
  socketEmit('open')

  t.ok(channel.open)
  t.notOk(channel.subsOnly)

  t.end()
})

tap.test('should not add a challenger', function notAddIncompleteTest(t) {
  socketEmit('add')
  socketEmit('add notenough')
  socketEmit('add notenough notenough')

  t.equal(queue.size, 2)
  t.notOk(queue.has(TEST_CHALLENGER3))

  t.end()
})

tap.test('should add a challenger', function addTest(t) {
  socketEmit(
    `add ${TEST_CHALLENGER3} ${TEST_CHALLENGER3} TEST3 CHALLENGER3`
  , TEST_CHALLENGER3
  )

  t.equal(queue.size, 3)
  t.ok(queue.has(TEST_CHALLENGER3))

  const challengers = queue.values()
  challengers.next()
  challengers.next()
  const challenger = challengers.next().value

  t.equal(challenger.username, TEST_CHALLENGER3)
  t.equal(challenger.nnid, TEST_CHALLENGER3)
  t.equal(challenger.ingameName, 'TEST3 CHALLENGER3')

  t.end()
})

tap.test('should set first to 5', function setFirstToFive(t) {
  socketEmit('set firstViewer 5')

  t.equal(channel.firstTo, 5)

  t.end()
})

tap.test('should set first to 1', function setFirstToOne(t) {
  socketEmit('set first 1')

  t.equal(channel.firstTo, 1)
  t.equal(channel.firstToSub, 1)

  t.end()
})

tap.test('should set subs first to 8', function setSubsFirstToEight(t) {
  socketEmit('set firstSub 8')

  t.equal(channel.firstTo, 1)
  t.equal(channel.firstToSub, 8)

  t.end()
})

tap.test('should start match', function deleteTest(t) {
  socketEmit('start')

  t.equal(queue.size, 2)
  t.equal(channel.matches.length, 2)

  match = channel.currentMatch
  challenger = channel.currentChallenger

  t.ok(match)
  t.ok(challenger)
  t.equal(match.wins, 0)
  t.equal(match.losses, 0)
  t.equal(match.firstTo, 1)

  t.end()
})

tap.test('should forfeit match', function forfeitTest(t) {
  socketEmit('forfeit')

  t.ok(match.isForfeited)
  t.notOk(channel.currentMatch)
  t.notOk(channel.currentChallenger)

  t.end()
})

tap.test('should start match', function deleteTest(t) {
  socketEmit('start')

  t.equal(queue.size, 1)
  t.equal(channel.matches.length, 3)

  match = channel.currentMatch
  challenger = channel.currentChallenger

  t.ok(match)
  t.ok(challenger)
  t.equal(match.wins, 0)
  t.equal(match.losses, 0)
  t.equal(match.firstTo, 8)

  t.end()
})

tap.test('should not start match', function notStartTest(t) {
  socketEmit('start')

  t.equal(queue.size, 1)
  t.equal(channel.matches.length, 3)

  match = channel.currentMatch
  challenger = channel.currentChallenger

  t.ok(match)
  t.ok(challenger)
  t.equal(match.wins, 0)
  t.equal(match.losses, 0)
  t.equal(match.firstTo, 8)

  t.end()
})

tap.test('should lose the match', function matchLoseTest(t) {
  for (let i=1; i <= 8; i++) {
    socketEmit('loss')

    t.equal(match.wins, 0)
    t.equal(match.losses, i)

    if (match.losses === 8) {
      break
    }

    t.notOk(match.checkRecord())
  }

  t.ok(match.checkRecord())

  t.notOk(channel.currentMatch)
  t.notOk(channel.currentChallenger)

  t.end()
})

tap.test('should clear list', function clearTest(t) {
  socketEmit('clear')

  t.equal(channel.queue.size, 0)

  t.end()
})

tap.test('should close list', function closeTest(t) {
  socketEmit('close')

  t.notOk(channel.open)

  t.end()
})

tap.test('should deactivate bot', function deactivateTest(t) {
  socketEmit('off')

  t.notOk(channel.active)

  t.end()
})

tap.test('Should clear the rate limit', function clearRateLimitTest(t) {
  client.chatRate.clear()

  t.ok(client.chatRate.analyze)

  t.end()
})

tap.test('Should hit the rate limit', function rateLimitTest(t) {
  for (let i = 1; i < CHAT_RATE_LIMIT; i++) {
    t.ok(client.say('test', 'test'))
  }

  t.notOk(client.say('test', 'breaking the limit'))
  t.notOk(client.say('test', 'breaking the limit'))
  t.notOk(client.say('test', 'breaking the limit'))

  t.end()
})

tap.test('Should close client', function closeTest(t) {
  clearInterval(client.rateLogger)
  clearInterval(client.socketUpdater)

  t.end()
})
