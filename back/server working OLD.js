const app       = require('express')();
const http      = require('http').createServer(app);
const axios     = require('axios').default;
const io        = require('socket.io')(http);
const tmi       = require('tmi.js');
const jwt       = require('jsonwebtoken');
const sensitive = require('C:\\Users\\Jakes\\Desktop\\Socks\\twitch chart extension\\back\\sensitive.js');

const apiSecret = sensitive.apiSecret;
const clientId  = sensitive.clientID;
const secret    = sensitive.secret;
let authKey;


(async function() {
    try {
        let key = await authGetter(clientId, apiSecret);
        authKey = key.data;
        console.log(authKey);
        /*
        access_token:'at6wepikin1yl6abgy0nckuqvbn3bl'
        expires_in:4921235
        token_type:'bearer'
        */
        ioPath();
    } catch (e) {
        console.error(e);
    }

})();


// -------------------------------------------------------------------------------------
// ENDPOINTS

const port = 3000;

http.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

app.get("/", (req, res) => {
    res.sendFile('C:\\Users\\Jakes\\Desktop\\Socks\\twitch chart extension\\front\\index.html');
});

app.get("/graph", (req, res) => {
    res.sendFile('C:\\Users\\Jakes\\Desktop\\Socks\\twitch chart extension\\front\\graph.html');

});

app.get("/config", (req, res) => {
    res.sendFile(`C:\\Users\\Jakes\\Desktop\\Socks\\twitch chart extension\\front\\config.html`);
});

// -------------------------------------------------------------------------------------
// SOCKET.IO CONNECTION

let userCount = 0;
let updateTimer;
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
                //twitchConnect();
                console.log("Starting chart update interval timer.");
                updateTimer = setInterval(() => {
                    socket.broadcast.volatile.emit("chart update", total);
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
                    clearInterval(updateTimer);
                    twitchDisconnect();
                }, (dcTimerSetting * 1000));

            }
        });

        socket.on("channel info", async (data) => {


            let payload = verifyAndDecode(data.token);
            /*{
                exp: 1619311532,
                opaque_user_id: 'URIGPfFJCMZnARZPEAr',
                role: 'viewer',
                pubsub_perms: { listen: [ 'broadcast', 'global' ] },
                channel_id: '36985393',
                user_id: '36985393',
                iat: 1619225132
            }*/

            let url = 'https://api.twitch.tv/helix/channels?broadcaster_id=' + payload.channel_id;
            const aConfig = {
                headers: {
                    'Client-ID': clientId,
                    'Authorization': 'Bearer ' + authKey.access_token
                }
            };

            let casterName;
            try {
                let res = await idGetter(url, clientId, authKey.access_token);
                casterName = res.data.data[0].broadcaster_login;
            } catch (e) {
                console.error(e.response);
            }
            /* res =
            {
                data: [
                    {
                    broadcaster_id: '36985393',
                    broadcaster_login: 'windowpuncher',
                    broadcaster_name: 'windowpuncher',
                    broadcaster_language: 'en',
                    game_id: '0',
                    game_name: '',
                    title: 'testing'
                    }
                ]
            } */
            console.log(casterName);
            

        });
    });
} // < ioPath

// -------------------------------------------------------------------------------------
// TWITCH CORE INTEGRATION - API

async function idGetter(u, id, token) {
    const aConfig = {
        headers: {
            'Client-ID': id,
            'Authorization': 'Bearer ' + token
        }
    };

    try {
        return axios(u, aConfig);
    } catch (e) {
        console.error(e);
    }
}

async function authGetter(c, a) {
    const u = 'https://id.twitch.tv/oauth2/token?client_id=' + c + '&client_secret=' + s + '&grant_type=client_credentials';
    try {
        return axios(u, {method: 'post'});
    } catch (e) {
        console.error(e);
    }
}

function verifyAndDecode(header) {
    try {
        return jwt.verify(header, secret, { algorithms: ['HS256'] });
    }
    catch (e) {
        return console.error(`Invalid JWT: ${e}`);
    }
}



// -------------------------------------------------------------------------------------
// TWITCH CHAT INTEGRATION - TMI

let rawChat = [];
let total = 0; // <<< Initial Score Count
let compiler;

let clientOptions = {
    connection: { reconnect: true },
    channels: ['windowpuncher']
};

const client = new tmi.Client(clientOptions);

// CHECK IF STREAMER IS LIVE, IF NOT THEN DO NOT RUN   <<<<<<<   NEEDS TO BE DONE

const twitchConnect = function () {
    client.connect()
        .then((data) => {
            console.log(`Connected to Twitch server: ${data[0]} on ${data[1]}, watching ${clientOptions.channels}.`);
            compiler = setInterval(() => {
                reduced = rawChat.reduce((acc, cur) => { return acc + cur }, 0);
                total = reduced + total;
                rawChat = [];
            }, 2000);
        })
        .catch((err) => {
            if (err) console.error(err);
        });
};

const twitchDisconnect = function () {
    client.disconnect()
        .then((data) => {
            console.log(`Disconnected from Twitch.`);
            clearInterval(compiler);
            total = 0;
        }).catch((err) => {
            if (err) console.error(err);
        });
};

client.on("message", (channel, tags, message, self) => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];      // <<<< WHAT IF +2 and -4 in the same message?  Fix duplicate bug or do not count
    nums.forEach(num => {
        if (message === `+${num}` || message.includes(`+${num} `) || message.includes(` +${num}`) || message.includes(` +${num} `)) {
            rawChat.push(num);
        } else if (message === `-${num}` || message.includes(`-${num} `) || message.includes(` -${num}`) || message.includes(` -${num} `)) {
            rawChat.push(num * -1);
        }
    });
});