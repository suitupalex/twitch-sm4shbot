# twitch-sm4shbot

[![Build Status](https://api.travis-ci.org/suitupalex/twitch-sm4shbot.svg)](https://travis-ci.org/suitupalex/twitch-sm4shbot)
[![npm version](https://badge.fury.io/js/twitch-sm4shbot.svg)](https://badge.fury.io/js/twitch-sm4shbot)
[![Dependencies](https://david-dm.org/suitupalex/twitch-sm4shbot.svg)](https://david-dm.org/suitupalex/twitch-sm4shbot)

A Twitch bot for Smash 4 streamers.

## Setup

Simply make `twitch-sm4shbot` a moderator of your stream. Then login with your
twitch account to [Sm4shBot.com](http://sm4shbot.com) which provides a graphical
dashboard to manage your stream.

## Chat Commands

Here's how to interact with the bot inside your chat.

> Protip: Many commands have Aliases that might be quicker to type
> or easier to remember.

### Keyword

The kewyord to trigger bot commands is `!sm4sh`. E.g.:

```irc
<zssrocks> !sm4sh on
<twitch_sm4shbot> @zssrocks, Sm4shBot has been activated. Happy sm4shing!
```

*Aliases: !smash*

### Admin

These comamnds can only be run by trusted admins. The streamer is always a
trusted admin.

#### on

Activates Sm4shbot in your chat. No commands will work until activation.

```irc
<zssrocks> !sm4sh on
```

*Aliases: activate*

#### off

Deactivates Sm4shbot in your chat. No commands afterward will work.

```irc
<zssrocks> !sm4sh off
```

*Aliases: deactivate*

#### open *[subscriber only]*

Opens the challenger list for entries.

```irc
<zssrocks> !sm4sh open
```

If you add `true`, `subs`, or `subscribers`, the list will only be open for
subscribers.

```irc
<zssrocks> !sm4sh open true
<zssrocks> !sm4sh open subs
<zssrocks> !sm4sh open subscribers
```

To switch back to both subs and viewers, just send open with nothing else.

```irc
<zssrocks> !sm4sh open
```

#### close

Closes the challenger list for entries. Admins are still able to manually add
challengers with the `add` command.

```irc
<zssrocks> !sm4sh close
```

#### add *&lt;Twitch Username> &lt;NNID> &lt;In-Game Name>*

Manually adds a challenger to the end of the list. This command can be used even
if the list is closed.

```irc
<zssrocks> !sm4sh add rosaluma popOff22 Danny
```

#### remove *&lt;Twitch Username>*

Manually removes a challenger from the list.

```irc
<zssrocks> !sm4sh remove rosaluma
```

*Aliases: rm*

#### next

Shows details about the next challenger. **This does not move to the next
match.**

```irc
<zssrocks> !sm4sh next
```

#### start

Starts the next match in the list. It also notifies the challenger on-deck to
start getting ready.

```irc
<zssrocks> !sm4sh start
```

*Aliases: s*

#### win

Registers a **game win for the streamer**. If the game was a set winner,
everyone is notified and the match is ended. To start the next match, you must
send the `start` command.

```irc
<zssrocks> !sm4sh win
```

*Aliases: w*

#### loss

Registers a **game loss for the streamer**. If the game was a set winner,
everyone is notified and the match is ended. To start the next match, you must
send the `start` command.

```irc
<zssrocks> !sm4sh loss
```

*Aliases: l*

#### forfeit

Register a match forfeit. Does not count as a loss or a win for the streamer. To
start the next match, you must send the `start` command.

```irc
<zssrocks> !sm4sh forfeit
```

*Aliases: ff*

#### set *&lt;option> &lt;value>*

Sets a value for an option. These will not be applied to matches that are
currently in progress.

```irc
<zssrocks> !sm4sh set firstTo 5
```

Here's what you can set:

##### firstTo *&lt;number of games>*

Sets the number of games a challenger or the streamer must win to take the set.
*The default is 3 for viewers and 5 for subs.* **This will overwrite the first
to criteria for both viewers and subs.**

*Aliases: firstto, first*

##### firstToViewer *&lt;number of games>*

Sets the number of games a viewer or the streamer must win to take the set.
*The default is 2 (best of 3).*

*Aliases: firsttoviewer, firstviewer, firstviewer, fv*

##### firstToSubs *&lt;number of games>*

Sets the number of games a sub or the streamer must win to take the set.
*The default is 3 (best of 5).*

*Aliases: firstToSubs, firstSubs, firstsubs, fs*

### Challenger (Public)

The following commands can be used by anyone in the chat.

#### enter *&lt;NNID> &lt;In-Game Name>*

Enters you into the challenger list.

```irc
<rosaluma> !sm4sh enter popOff22 Danny
```

*Aliases: join, register*

#### leave

Drops you from the challenger list.

```irc
<rosaluma> !sm4sh leave
```

*Aliases: lv, drop*

#### list

Shows the list of challengers. This command only works once every 30 seconds to
prevent spamming.

```irc
<rosaluma> !sm4sh list
```

*Aliases: ls*

## License

Copyright (c) 2015 Alexander Martin

MIT (http://www.opensource.org/licenses/mit-license.php)
