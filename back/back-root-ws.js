"use strict";

require('cors');
const app =         require('express')(),
    http =          require('http').createServer(app),
    { Server } =    require('socket.io'),
    io = new Server(http, {
        serveClient: false,
        cors: {
            origin: [/https?:\/\/localhost:\d{1,5}/i, 'https://2ilkhrt4j2qjfj85s7bxhj560gqnvy.ext-twitch.tv', 'https://www.twitch.tv'],
            methods: "GET",
            credentials: true
        }
    }),
    tChat =         require('./modules/TMI_api.js'),
    core =          require('./modules/core_api.js'),
    sensitive =     require('./secrets/sensitive.js'),
    gbvr =          require('./modules/global_vars.js'),
    port = 3001;

/*
chatConStatus: undefined,
lobbyLeaveTimer: undefined,
tLeaveTimer: undefined,
dcTimer: undefined,
keyObj: {},
lobbies: {},
channelList: new Map(),
userCount: 0
*/

// -------------------------------------------------------------------------------------
// STARTER FUNCTIONS

class Lobby {
    constructor(channelName) {
        this.userCount = 0;
        this.updateTimer = undefined;
        this.emitter = function (socket) {
            this.updateTimer = setInterval(() => {
                socket.to(channelName).volatile.emit("chart update", tChat.channelDataList[channelName].total);
            }, 2000);
        };
    }
}

function authMaintainer(cID, sec) {
    let timeout = gbvr.keyObj.expiration - 300000;
    console.log(`Auth maintainer expired, refreshing in ${(timeout / 60000).toFixed(1)} minutes.`);
    setTimeout(async () => {
        let maintKey = await core.authConnector(false, cID, sec);
        gbvr.keyObj = {
            auth: maintKey.data.access_token,
            expiration: maintKey.data.expires_in
        };
        authMaintainer(cID, sec);
    }, (timeout));
}

(async function () {
    try {
        let key = await core.authConnector(false, sensitive.clientID, sensitive.apiSecret);
        gbvr.keyObj = {
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
// ENDPOINT

http.listen(port, () => {
    console.log(`Listening on HTTP for Socket.IO on port ${port}`);
});

// -------------------------------------------------------------------------------------
// SOCKET.IO CONNECTION

function ioPath() {
    console.log('Socket.IO listening');
    io.on("connection", (socket) => {
        let channelName;

        socket.on('channel info', async (id) => {
            console.log(typeof id);
            gbvr.userCount++;
            console.log(`User connected, usercount: ${gbvr.userCount}`);

            if (id[0] === '.') {
                channelName = id.substr(1);
            } else {
                let query = gbvr.channelList.get(id);
                if (query) {
                    channelName = query;
                } else {
                    channelName = await core.nameConnector(false, id, sensitive.clientID, gbvr.keyObj.auth);
                    channelName = channelName.data.data[0].broadcaster_login;
                    gbvr.channelList.set(id, channelName);
                }
            }

            socket.join(channelName);

            if (gbvr.chatConStatus === false || gbvr.chatConStatus === undefined) {
                await tChat.connect();
                if (tChat.client.readyState() === 'OPEN') {
                    gbvr.chatConStatus = true;
                } else {
                    socket.emit('TMI Failure');
                    return;
                }
            }

            if (gbvr.userCount === 1 && gbvr.dcTimer && gbvr.dcTimer._destroyed === false) {
                clearTimeout(gbvr.dcTimer);
                console.log("Disconnect timer cancelled.");
            }

            if (!tChat.channelDataList[channelName]) {
                console.log(`Creating new Twitch ChannelData Object: ${channelName}`);
                tChat.channelDataList[channelName] = new tChat.ChannelData();
                await tChat.join(channelName);
            }

            tChat.channelDataList[channelName].viewCount++;
            //console.log(`User connected, tChat.channelDataList.${channelName}.usercount ${tChat.channelDataList[channelName].viewCount}`);

            if (tChat.channelDataList[channelName]) {
                if (tChat.channelDataList[channelName].viewCount === 1 && gbvr.tLeaveTimer && gbvr.tLeaveTimer._destroyed === false) {
                    clearTimeout(gbvr.tLeaveTimer);
                    console.log("gbvr.tLeaveTimer timer cancelled.");
                }
            }

            if (!gbvr.lobbies[channelName]) {
                gbvr.lobbies[channelName] = new Lobby(channelName);
                gbvr.lobbies[channelName].emitter(socket);
            }

            gbvr.lobbies[channelName].userCount++;
            //console.log(`User connected, gbvr.lobbies.${channelName}.usercount: ${gbvr.lobbies[channelName].userCount}`);

            if (gbvr.lobbies[channelName]) {
                if (gbvr.lobbies[channelName].userCount === 1 && gbvr.lobbyLeaveTimer && gbvr.lobbyLeaveTimer._destroyed === false) {
                    clearTimeout(gbvr.lobbyLeaveTimer);
                    console.log("gbvr.lobbyLeaveTimer timer cancelled.");
                }
            }
        });

        socket.on('disconnect', () => {
            if (gbvr.chatConStatus === false || gbvr.chatConStatus === undefined) {
                gbvr.userCount--;
                console.log(`User disconnected while TMI is down, usercount: ${gbvr.userCount}`);
            } else {
                gbvr.userCount--;
                console.log(`User disconnected, usercount: ${gbvr.userCount}`);

                gbvr.lobbies[channelName].userCount--;
                //console.log(`User disconnected, gbvr.lobbies.${channelName}.userCount: ${gbvr.lobbies[channelName].userCount}`);

                tChat.channelDataList[channelName].viewCount--;
                //console.log(`User disconnected, channelDataList.${channelName}.viewCount--: ${tChat.channelDataList[channelName].viewCount}`);

                if (gbvr.lobbies[channelName].userCount <= 0) {
                    gbvr.lobbyLeaveTimer = setTimeout(() => {
                        console.log(`gbvr.lobbies: ${channelName} deleted.`);
                        clearInterval(gbvr.lobbies[channelName].updateTimer);
                        delete gbvr.lobbies[channelName];
                    }, 5000);
                }

                if (tChat.channelDataList[channelName].viewCount <= 0) {
                    gbvr.tLeaveTimer = setTimeout(() => {
                        tChat.leave(channelName);
                    }, 5000);
                }

                if (gbvr.userCount <= 0) {
                    gbvr.dcTimer = setTimeout(async () => {
                        await tChat.disconnect();
                        gbvr.chatConStatus = false;
                    }, 6000);
                }
            }
        });
    });
}