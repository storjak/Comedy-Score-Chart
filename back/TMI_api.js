const tmi = require('tmi.js');
const tmiExports = {
    total: 0,
    rawChat: [],
    compilerTimer: undefined,
    connect: function (channelName) {
        const clientOptions = {
            connection: { reconnect: true },
            channels: [channelName]
        };
        let client = new tmi.Client(clientOptions);
        client.connect()
            .then((data) => {
                console.log(`Connected to Twitch server: ${data[0]} on ${data[1]}, watching #${channelName}.`);
                this.compilerTimer = setInterval(() => {
                    this.compiler();
                }, 2000);
            })
            .catch((err) => {
                console.error(err);
            });

        client.on("message", (channel, tags, message, self) => {
            this.chatParser(message);
        });
    },
    disconnect: function () {
        client.disconnect()
            .then((data) => {
                console.log(`Disconnected from Twitch.`);
                clearInterval(this.compilerTimer);
                this.total = 0;
            }).catch((err) => {
                if (err) console.error(err);
            });
    },
    compiler: function () { // < Wrap me in a 2 second setInterval!
        let reduced = this.rawChat.reduce((acc, cur) => { return acc + cur }, 0);
        this.total += reduced;
        this.rawChat = [];
    },
    chatParser: function (msg) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];      // <<<< WHAT IF +2 and -4 in the same message?  Fix duplicate bug or do not count
        nums.forEach(num => {
            if (msg === `+${num}` || msg.includes(`+${num} `) || msg.includes(` +${num}`) || msg.includes(` +${num} `)) {
                this.rawChat.push(num);
            } else if (msg === `-${num}` || msg.includes(`-${num} `) || msg.includes(` -${num}`) || msg.includes(` -${num} `)) {
                this.rawChat.push(num * -1);
            }
        });
    }
}

module.exports = tmiExports;