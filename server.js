const { Server } = require('ws');
const express = require('express');

const PORT = process.env.PORT || 4000;
const INDEX = '/index.html';
const DEFAULT_ERROR_SOKET = JSON.stringify({status: 1, data: []});

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });
let clients = {};

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on("message", (message) => {
        let obj = {}
        try {
            obj = JSON.parse(message);
        } catch {
            return;
        }

        if(!obj.hasOwnProperty('type') || !obj.hasOwnProperty('args')){
            return;
        }

        let roomToken = "";
        let nick = "";
        switch(obj.type){
            case 'createRoom':
                const crypto = require('crypto');   
                while(clients.hasOwnProperty(roomToken) || roomToken == "")
                    roomToken = crypto.randomBytes(4).toString('hex');

                ws.isOperator = true;
                clients[roomToken] = [ws];
                console.log("Created room " + roomToken);
                ws.send(JSON.stringify({type: "run-game", room: roomToken, isoper: true}));
                break;
            
            case 'joinToRoom':

                roomToken = obj.args[1];
                nick = obj.args[0] || "Unknown";
                if(roomToken == "" || 
                    !clients.hasOwnProperty(roomToken) || 
                    clients[roomToken].lenght >= 2){

                    return;
                }

                clients[roomToken].push(ws);
                clients[roomToken][0].send(JSON.stringify({type: "msg", msg: nick + " join"}));
                clients[roomToken][1].send(JSON.stringify({type: "run-game", room: roomToken, isoper: false}));
                break;
           
            case 'msg':

                roomToken = obj.args[1];
                nick = obj.args[0] || "Unknown";
                if(roomToken == "" || !clients.hasOwnProperty(roomToken)){
                    return;
                }
                
                const client = clients[roomToken].find(item => item.isOperator !== ws.isOperator);

                client.send(JSON.stringify({type: "msg", msg: obj.args[2]}));
                break;
        }
    });
    // if(clients1 == null){
    //     clients1 = ws;
    //     ws.on("message", (message) => {
    //         if(clients2 == null) return;
    //         clients2.send(message);
    //     });
    // } else {
    //     clients2 = ws;
    //     ws.on("message", (message) => {
    //         if(clients1 == null) return;
    //         clients1.send(message);
    //     });
    // }

    ws.on('close', () => console.log('Client disconnected'));
});