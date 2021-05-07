const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const tChat = require('./TMI_api.js');
const core = require('./core_api.js');
const sensitive = require('./sensitive.js');

// -------------------------------------------------------------------------------------
// GLOBAL VARIABLES

// https://dev.twitch.tv/docs/api/reference#get-streams << just a temporary bookmark

let keyObj = {};
let lobbies = {};
let chatConStatus;
let channelList = new Map();
let userCount = 0;
let lobbyLeaveTimer;
let tLeaveTimer;
let dcTimer;
let usChannelName;
// -------------------------------------------------------------------------------------
// STARTER FUNCTIONS

function authMaintainer(cID, sec) {
    console.log(`Auth maintainer tripped, refreshing in ${((keyObj.expiration - 1000000)/60000).toFixed(1)} minutes.`);
    return new Promise((resolve) => {
        setTimeout(async() => {
            let maintKey = await core.authConnector(false, sensitive.clientID, sensitive.apiSecret);
            keyObj = {
                auth: maintKey.data.access_token,
                expiration: maintKey.data.expires_in
            };
            authMaintainer(cID, sec);
            resolve(maintKey);
        }, (keyObj.expiration - 1000000));
    });
}

(async function () {
    try {
        let key = await core.authConnector(false, sensitive.clientID, sensitive.apiSecret);
        keyObj = {
            auth: key.data.access_token,
            expiration: key.data.expires_in
        };
        ioPath();
        authMaintainer(sensitive.clientID, sensitive.apiSecret);
    } catch (e) {
        console.error(`starter function error: ${e}`);
        return e;
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
    
app.get("/userscript/:usname", (req, res) => {
    usChannelName = req.params.usname;
    res.sendFile(rootString + '\\front\\userscript_graph.html');
});

app.get("/config", (req, res) => {
    res.sendFile(rootString + '\\front\\config.html');
});

app.get("/error", (req, res) => {
    res.sendFile(rootString + '\\front\\error.html');
});
// -------------------------------------------------------------------------------------
// SOCKET.IO CONNECTION

function Lobby(channelName) {
    this.userCount = 0;
    this.updateTimer = undefined;
    this.emitter = function (socket) {
        this.updateTimer = setInterval(() => {
            socket.to(channelName).volatile.emit("chart update", tChat.channelDataList[channelName].total);
        }, 2000);
    }
}

function ioPath() {
    console.log('Socket.IO listening');

    io.on("connection", (socket) => {
        let channelName;

        socket.on('channel info', async (id) => {
            userCount++;
            console.log(`User connected, usercount: ${userCount}`);

            if (id === '.') {
                channelName = usChannelName;
            } else {
                let query = channelList.get(id);
                if (query) {
                    channelName = query;
                } else {
                    channelName = await core.nameConnector(false, id, sensitive.clientID, keyObj.auth);
                    channelName = channelName.data.data[0].broadcaster_login;
                    channelList.set(id, channelName);
                }
            }

            socket.join(channelName);

            if (chatConStatus === false || chatConStatus === undefined) {
                await tChat.connect();
                if (tChat.client.readyState() === 'OPEN') { // Returns one of the following states: "CONNECTING", "OPEN", "CLOSING" or "CLOSED"
                    chatConStatus = true;
                } else {
                    socket.emit('TMI Failure');
                    return;
                }
            }

            if (userCount === 1 && dcTimer && dcTimer._destroyed === false) {
                clearTimeout(dcTimer);
                console.log("Disconnect timer cancelled.");
            }

            if (!tChat.channelDataList[channelName]) {
                console.log(`Creating new Twitch ChannelData Object: ${channelName}`);
                tChat.channelDataList[channelName] = new tChat.ChannelData();
                await tChat.join(channelName);
            }

            tChat.channelDataList[channelName].viewCount++;
            console.log(`User connected, tChat.channelDataList.${channelName}.usercount ${tChat.channelDataList[channelName].viewCount}`);

            if (tChat.channelDataList[channelName]){
                if (tChat.channelDataList[channelName].viewCount === 1 && tLeaveTimer && tLeaveTimer._destroyed === false) {
                    clearTimeout(tLeaveTimer);
                    console.log("tLeaveTimer timer cancelled.");
                }
            }

            if (!lobbies[channelName]) {
                lobbies[channelName] = new Lobby(channelName);
                lobbies[channelName].emitter(socket);
            } 

            lobbies[channelName].userCount++;
            console.log(`User connected, lobbies.${channelName}.usercount: ${lobbies[channelName].userCount}`);
            
            if (lobbies[channelName]){
                if (lobbies[channelName].userCount === 1 && lobbyLeaveTimer && lobbyLeaveTimer._destroyed === false) {
                    clearTimeout(lobbyLeaveTimer);
                        console.log("lobbyLeaveTimer timer cancelled.");
                }
            }
        });

        socket.on('disconnect', () => {

            if (chatConStatus === false || chatConStatus === undefined) {
                userCount--;
                console.log(`User disconnected while TMI is down, usercount: ${userCount}`);
            } else {

                userCount--;
                console.log(`User disconnected, usercount: ${userCount}`);
                
                lobbies[channelName].userCount--;
                console.log(`User disconnected, lobbies.${channelName}.userCount: ${lobbies[channelName].userCount}`);

                tChat.channelDataList[channelName].viewCount--;
                console.log(`User disconnected, channelDataList.${channelName}.viewCount--: ${tChat.channelDataList[channelName].viewCount}`);

                if (lobbies[channelName].userCount <= 0) {
                    lobbyLeaveTimer = setTimeout(() => {
                        console.log(`lobbies: ${channelName} deleted.`);
                        clearInterval(lobbies[channelName].updateTimer);
                        delete lobbies[channelName];
                    }, 5000);
                }

                if (tChat.channelDataList[channelName].viewCount <= 0) {
                    tLeaveTimer = setTimeout(() => {
                        tChat.leave(channelName);
                    }, 5000);
                }

                if (userCount <= 0) {
                    dcTimer = setTimeout(async () => {
                        await tChat.disconnect();
                        chatConStatus = false;
                    }, 6000);
                }
            }
        });
    });
}
