Twitch Comedy Chart Extension

Obviously, this project isn't done yet ;v

Author - storjak@gmail.com

Features -

This loads on a Twitch.tv's streamer page during a live stream and will collect and compile a live "comedy" score, according to input from users in chat.  It will visually display it in the form of a graph.

Instructions -
    
This will be available as an official Twitch.tv extension, and as a standalone userscript for users who chose not to use Twitch extensions, or for users who wish to track a channel's score on a channel without the extension installed.

The file referenced as "sensitive.js" contains 3 key items: your extensions's client ID, the client secret, and the Twitch OAuth token secret.  I've formatted mine as is below:
```javascript
const secrets = {
    clientID: "Your extension's client ID",
    clientSecret: Buffer.from("Your extensions's client secret", 'base64'),
    apiSecret: "Your extension's secret used for OAuth tokens"
};
module.exports = secrets;
```
You will need to create your own file and fill it with your own Twitch extension secrets.

Full instructions aren't written quite yet.

Issues -

Currently implementing channels and the ability to automatically add and remove rooms with socket.io.  Also needs a method to limit Twitch API requests, and will start a temporary local database with key pairs of channel id's to channel names to reduce total requests.

Also does not yet detect channel live status, which will affect if the chart activates at all.  However, seeing as extensions normally aren't visible on an offline channel, this may not be an issue.

Last updated 20210427
