const { Server } = require('ws');
const express = require('express');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });
let clients1 = null;
let clients2 = null;

wss.on('connection', (ws) => {
    console.log('Client connected');
    if(clients1 == null){
        clients1 = ws;
        ws.on("message", (message) => {
            if(clients2 == null) return;
            clients2.send(message);
        });
    } else {
        clients2 = ws;
        ws.on("message", (message) => {
            if(clients1 == null) return;
            clients1.send(message);
        });
    }

    ws.on('close', () => console.log('Client disconnected'));
});