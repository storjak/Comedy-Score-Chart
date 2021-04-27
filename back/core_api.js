const axios     = require('axios').default;

const coreExports = {
    idGetter: async function(u, id, token) {
        const aConfig = {
            headers: {
                'Client-ID': id,
                'Authorization': 'Bearer ' + token
            }
        };
        try {
            return axios(u, aConfig);
        } catch (e) {
            return console.error('idGetter error: ' + e);
        }
    },
    authGetter: async function(c, s) {
        const u = 'https://id.twitch.tv/oauth2/token?client_id=' + c + '&client_secret=' + s + '&grant_type=client_credentials';
        try {
            return axios(u, {method: 'post'});
        } catch (e) {
            return console.error('authGetter error: ' + e);
        }
    }
}

module.exports = coreExports;