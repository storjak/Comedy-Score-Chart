const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const tChat = require('./TMI_api.js');
const core = require('./core_api.js');
const sensitive = require('./sensitive.js');

let authKey;
let authKeyExpiration;
let channelName;

(async function () {
    try {
        let key = await core.authGetter(sensitive.clientID, sensitive.apiSecret);
        authKey = key.data.access_token;
        authKeyExpiration = key.data.expires_in;
        ioPath();
    } catch (e) {
        console.error(e);
    }
})();

// -------------------------------------------------------------------------------------
// ENDPOINTS

const port = 3000;

let rootString = __dirname;

rootString = __dirname.substr(0, rootString.length - 5);

http.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

app.get("/", (req, res) => {
    res.sendFile(rootString + '\\front\\index.html');
});

app.get("/graph", (req, res) => {
    res.sendFile(rootString + '\\front\\graph.html');
});

app.get("/config", (req, res) => {
    res.sendFile(rootString + '\\front\\config.html');

});

// -------------------------------------------------------------------------------------
// GLOBAL VARIABLES
let channelList = {}; // <<< Object of key pairs for temporary ID storage to reduce API calls, e.g. {channelId: channelName}
let userCount = 0;
let broadcastTimer;
let dcTimer;
const dcTimerSetting = 20; // <<< SET IN SECONDS, NOT ms
// -------------------------------------------------------------------------------------
// SOCKET.IO CONNECTION


function ioPath() {
    io.on("connection", (socket) => {
        userCount++;
        console.log(`User connected, usercount: ${userCount}`);

        if (userCount === 1) {
            if (dcTimer && dcTimer._destroyed === false) {
                clearTimeout(dcTimer);
                console.log("Disconnect timer cancelled.");
            } else {
                tChat.connect('windowpuncher'); // << CHANNEL NAME HERE
                console.log("Starting chart update interval timer.");
                broadcastTimer = setInterval(() => {
                    socket.broadcast.volatile.emit("chart update", tChat.total);
                }, 2000);
            }
        }

        socket.on("disconnect", () => {
            userCount--;
            console.log(`User disconnected, usercount: ${userCount}`);
            if (userCount === 0) {
                console.log(`${dcTimerSetting} second disconnect timer started.`);
                dcTimer = setTimeout(() => {
                    console.log("Stopped chart update interval timer.");
                    clearInterval(broadcastTimer);
                    tChat.disconnect();
                }, (dcTimerSetting * 1000));

            }
        });

        socket.on("channel info", async (channelId) => {
            if (!channelList[channelId]) {
                channelName = await core.nameGetter(channelId, sensitive.clientID, authKey);
                console.log(channelList);
                channelList[channelId] = channelName;
                console.log(channelList);
            } else if (channelList.channelId) {
                channelName = channelList[channelId];
            }
            console.log(channelName);
        });
    });
}