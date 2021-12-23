"use strict";
const rootString = __dirname.substr(0, __dirname.length - 5),
    app = require('express')(),
    fs = require('fs'),
    https = require('https').createServer({
        key: fs.readFileSync(rootString + '\\front\\secrets\\selfsigned.key', 'utf8'),
        cert: fs.readFileSync(rootString + '\\front\\secrets\\selfsigned.crt', 'utf8')
    }, app),
    port = 3000;

https.listen(port, () => {
    console.log(`Listening on HTTPS for page serving, port ${port}`);
});

app.use("/", (req, res, next) => {
    console.dir(req.rawHeaders);
    next();
});

app.get("/graph.html", (req, res) => {
    res.sendFile(rootString + './front/pages/graph.html');
});

app.get("/graph.js", (req, res) => {
    res.sendFile(rootString + './front/pages/graph.js')
});

app.get("/userscript/:usname", (req, res) => {
    res.sendFile(rootString + './front/pages/userscript_graph.html');
});

app.get("/config", (req, res) => {
    res.sendFile(rootString + './front/pages/config.html');
});

app.get("/error", (req, res) => {
    res.sendFile(rootString + './front/pages/error.html');
});

app.get("/offline", (req, res) => {
    res.sendFile(rootString + './front/pages/offline.html');
});