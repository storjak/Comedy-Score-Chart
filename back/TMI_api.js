const tmi = require('tmi.js');
const tmiExports = {
    ChannelData: function () {
        this.total = 0;
        this.rawChat = [];
        this.viewCount = 0;
        this.parserTimer;
    },
    channelDataList: {},
    client: undefined,
    connect: function () {
        const clientOptions = {
            connection: { reconnect: true },
            joinInterval: 300,
            skipMembership: true,
            skipUpdatingEmotesets: true,
            updateEmotesetsTimer: 0,
        };
        this.client = new tmi.Client(clientOptions);
        return this.client.connect()
            .then((data) => {
                //console.log(data);
                console.log(`Connected to Twitch IRC server: ${data[0]} on ${data[1]}.`);
            })
            .catch((err) => {
                console.error(err);
            });
    },
    disconnect: function () {
        return this.client.disconnect()
            .then((data) => {
                console.log(`Disconnected from Twitch IRC server.`);
                this.channelDataList = {};
            }).catch((err) => {
                if (err) console.error(err);
            });
    },
    join: function (channelName) {
        return this.client.join(channelName)
            .then(data => {
                console.log(`Server joining Twitch chat channel: ${channelName}`);
                this.channelDataList[channelName].parserTimer = setInterval(() => {
                    let reduced = this.channelDataList[channelName].rawChat.reduce((acc, cur) => { return acc + cur }, 0);
                    this.channelDataList[channelName].total += reduced;
                    this.channelDataList[channelName].rawChat = [];
                }, 2000);
        
                this.client.on("message", (channel, tags, message, self) => {
                    if (channel === '#' + channelName) {
                        this.messageParser(message, channelName);
                        //this.channelDataList[channelName].rawChat.push(this.messageParser(message));
                    }
                });
            }).catch(e => {
                console.error(e);
            });
    },
    leave: function (channelName) {
        this.client.part(channelName)
            .then(data => {
                console.log(`Server leaving Twitch chat channel: ${channelName}`);
                clearInterval(this.channelDataList[channelName].parserTimer);
                delete this.channelDataList[channelName];
            }).catch(e => {
                console.error(e);
            });
    },
    messageParser: function (msg, channelName) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];      // <<<< WHAT IF +2 and -4 in the same message?  Fix duplicate bug or do not count
        nums.forEach(num => {
            if (msg === `+${num}` || msg.includes(`+${num} `) || msg.includes(` +${num}`) || msg.includes(` +${num} `)) {
                this.channelDataList[channelName].rawChat.push(num);
            } else if (msg === `-${num}` || msg.includes(`-${num} `) || msg.includes(` -${num}`) || msg.includes(` -${num} `)) {
                this.channelDataList[channelName].rawChat.push(num* -1);
            }
        });
    }
}

module.exports = tmiExports;