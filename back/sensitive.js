// THIS IS A SAMPLE FILE - NEVER EXPOSE YOUR PRIVATE ID'S AND SECRETS
const secrets = {
    clientID: "Your extension's client ID",
    clientSecret: Buffer.from("Your extensions's client secret", 'base64'),
    apiSecret: "Your extension's secret used for OAuth tokens"
};
module.exports = secrets;
