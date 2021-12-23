const axios = require('axios').default;

const coreExports = {
    nameGetter: async function (chId, clId, key) {
        const nameConfig = {
            url: 'https://api.twitch.tv/helix/channels?broadcaster_id=' + chId,
            headers: {
                'Client-ID': clId,
                'Authorization': 'Bearer ' + key
            },
            timeout: 5000
        };
        try {
            return await axios(nameConfig);
        } catch (e) {
            console.error('core.nameGetter error: ' + e);
            return Promise.reject(e);
        }
    },
    nameConnector: async function (stop, chId, clId, key) {
        try {
            return await this.nameGetter(chId, clId, key);
        } catch (e) {
            if (stop === false) {
                setTimeout(() => {
                    console.error('nameGetter connection failed, retrying...');
                    this.nameConnector(stop, chId, clId, key);
                }, 500);
            } else {
                console.error(`nameConnector stopped: ${e}`);
            }
        }
    },
    authGetter: async function (c, s) {
        const authConfig = {
            url: 'https://id.twitch.tv/oauth2/token?client_id=' + c + '&client_secret=' + s + '&grant_type=client_credentials',
            method: 'post',
            timeout: 5000
        };
        try {
            return await axios(authConfig);
        } catch (e) {
            console.error('authGetter connection error: ' + e);
            return Promise.reject(e);
        }
    },
    authConnector: async function (stop, cID, sec) {
        try {
            return await this.authGetter(cID, sec);
        } catch (e) {
            if (stop === false) {
                console.log('Retrying authGetter connection in 5 seconds...');
                setTimeout(() => {
                    this.authConnector(stop, cID, sec);
                }, 5000);
            } else {
                console.error(`authConnector stopped: ${e}`);
            }
        }
    }
}

module.exports = coreExports;