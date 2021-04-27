const app       = require('express')();
const http      = require('http').createServer(app);
const io        = require('socket.io')(http);
const tChat     = require('./TMI_api.js');
const core      = require('./core_api.js');
const sensitive = require('./sensitive.js');

let authKey;
let authKeyExpiration;
let casterName;

(async function() {
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
// SOCKET.IO CONNECTION

let userCount = 0;
let broadcastTimer;
let dcTimer;
const dcTimerSetting = 60; // <<< SET IN SECONDS, NOT ms

function ioPath (){
    io.on("connection", (socket) => {
        userCount++;
        console.log(`User connected, usercount: ${userCount}`);

        if (userCount === 1) {
            if (dcTimer && dcTimer._destroyed === false) {
                clearTimeout(dcTimer);
                console.log("Disconnect timer cancelled.");
            } else {
                tChat.connect();
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

        socket.on("channel info", async (data) => {
            let payload = core.verifyAndDecode(data.token, sensitive.clientSecret);
            let url = 'https://api.twitch.tv/helix/channels?broadcaster_id=' + payload.channel_id;
            try {
                let res = await core.idGetter(url, sensitive.clientID, authKey);
                casterName = res.data.data[0].broadcaster_login;
            } catch (e) {
                console.error(e.response);
            }
            console.log(casterName);

        });
    });
} // < ioPath