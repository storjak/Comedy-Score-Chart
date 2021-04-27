Twitch Comedy Chart Extension

Obviously, this project isn't done yet ;v

Author - storjak@gmail.com

Features -

    This loads on a Twitch.tv's streamer page during a live stream and will collect and compile a live "comedy" score, according to input from users in chat.  It will visually display it in the form of a graph.

Instructions -
    
    This will be available as an official Twitch.tv extension, and as a standalone userscript for users who chose not to use Twitch extensions, or for users who wish to track a channel's score on a channel without the extension installed.

    Instructions aren't written quite yet.

Issues -

    Currently implementing channels and the ability to automatically add and remove rooms with socket.io.  Also needs a method to limit Twitch API requests, and will start a temporary local database with key pairs of channel id's to channel names to reduce total requests.

    Also does not yet detect channel live status, which will affect if the chart activates at all.  However, seeing as extensions normally aren't visible on an offline channel, this may not be an issue.

Last updated 20210427