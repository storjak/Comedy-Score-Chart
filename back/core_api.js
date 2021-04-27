const axios = require('axios').default;

const coreExports = {
    nameGetter: async function (chId, clId, key) { // channelName = await nameGetter(channelId, sensitive.clientID, authKey);
        const aConfig = {
            url: 'https://api.twitch.tv/helix/channels?broadcaster_id=' + chId,
            headers: {
                'Client-ID': clId,
                'Authorization': 'Bearer ' + key
            }
        };
        try {
            const res = await axios(aConfig);
            return res.data.data[0].broadcaster_login;
        } catch (e) {
            return console.error('idGetter error: ' + e);
        }
    },
    authGetter: async function (c, s) {
        const u = 'https://id.twitch.tv/oauth2/token?client_id=' + c + '&client_secret=' + s + '&grant_type=client_credentials';
        try {
            return axios(u, { method: 'post' });
        } catch (e) {
            return console.error('authGetter error: ' + e);
        }
    }
}

module.exports = coreExports;