# Twitch.tv Comedy Score Chart Extension

Obviously, this project isn't done yet ;v

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

## Issues

For now, see the [issues page](https://github.com/storjak/Comedy-Score-Chart/issues).

Readme last updated 20210513
