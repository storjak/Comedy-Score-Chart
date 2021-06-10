# Twitch.tv Chat Score Chart Extension

Author - storjak@gmail.com

## Features

This loads on a Twitch.tv's streamer page during a live stream and will collect and compile a live "comedy" score, according to input from users in chat.  It will visually display it in the form of a graph.

This will be available as an official Twitch.tv extension, and as a standalone userscript for users who choose not to use Twitch extensions, or for users who wish to track a channel's score on a channel without the extension installed.

## Instructions

This is being used in a Node.js environment with npm.  If you haven't already, you need to install Node.js and npm, and their dependencies.  After the code is unzipped where you want it to be, you should be able to simply use `npm install` in a bash terminal in the root directory of this project.  From there you can run the server.js file with Node.js.

The file referenced as "sensitive.js" contains two key items: your extensions's client ID and the Twitch OAuth token secret.  I've formatted mine as is below:
```javascript
const secrets = {
    clientID: "Your extension's client ID",
    apiSecret: "Your extension's secret used for OAuth tokens"
};
module.exports = secrets;
```
You will need to create your own file and fill it with your own Twitch extension secrets.  This is mainly used to retrieve an OAuth for your backend so you can grab channel names from a channel ID.

Full instructions aren't written quite yet.

## Screenshots

### Extension version
![Imgur](https://i.imgur.com/nbFIpVj.png)

### User script version (draggable and resizable)
![Imgur](https://imgur.com/Qz5wJUG.png)

## Method
The way this app works is subject to change and is as follows:

Upon launching the server, it will establish its authentication token then set a recurring timer based on the expiration time, with plenty of time to spare.  It then sets up a websocket server and waits for clients to connect.

The client will send a GET request to the server, either through the user script wrapper, or the official Twitch extension.  The server will respond with graph.html, or userscript_graph.html.  Both files not only display the graph to show the user, but maintains a websocket connection with the server, as well.

When graph.html is loaded through the twitch extension, it finds the channel ID, an authentication for the streamer, and then connects to the server with that information as the first connection.  When the userscript version is loaded, it simply sends the name of the streamer to the server on the first connection.  At this point, both pages are connected to the websocket and are awaiting broadcasts from the server.

When a client joins the server, the server adds a count to its user total.  It then decides if it’s a user script or a Twitch client.  If it’s a Twitch client, it makes a Twitch API call to figure out the streamer’s name from the ID.  After it receives the data, the ID and the name are cached as a key-pair to reduce the number of API calls.

After this, the client’s websocket is subscribed to a “room”, receiving only broadcasts to that room, to support multiple twitch channels at the same time.  After joining the room, the server decides if it needs to open a new connection with Twitch’s IRC chat API, and does so if needed.  It then joins the respective chat channel, using the streamer’s name.  Another cache is created for users watching in a specific Twitch channel, or if it already exists, users are simply added.  If the user count drops to zero, such as when a stream ends, that channel’s user cache is emptied and deleted, and the channel is disconnected from the IRC chat.

After connecting to the IRC chat and joining the channel, the server will begin to watch the chat messages.  If a message contains the appropriate command, such as -2, +2, +9, -5, etc., it pushes the value of that command to an array.  Every two seconds, the array is evaluated and all the numbers are condensed to a total sum.  For example, if there were 100 messages parsed in those two sentences, and every single message contained “+2”, it would total the score to +200.  This value is then broadcasted, every two seconds, to all connected clients in that channel’s websocket room.  Their charts are all updated synchronously, at the same time, with the same numbers.  People can enter and leave at different times throughout the stream and consistently see the same numbers as everyone else.

Upon a client disconnecting, the server decides if it needs to disconnect from Twitch chat entirely, such as if the total server user count drops to zero.  Otherwise, the total user count is dropped by one, and the channel’s user count is dropped by one.  As stated earlier, if the channel’s user count drops to zero, it will completely remove the related cache.

## Issues

For now, see the [issues page](https://github.com/storjak/Comedy-Score-Chart/issues).

Readme last updated 20210610
