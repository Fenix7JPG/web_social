const express = require('express');
const WebSocket = require('ws');
const app = express();

// LA variable compartida — posiciones de todos los jugadores
let players = {};

app.use(express.static('public'));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor corriendo!');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  const id = Math.random().toString(36).slice(2);
  players[id] = { x: 100, y: 100 };

  // Decirle al jugador su ID + todos los jugadores actuales
  ws.send(JSON.stringify({ type: 'init', id, players }));

  // Avisarle a todos los demás que llegó alguien nuevo
  broadcast(ws, { type: 'playerJoined', id, x: 100, y: 100 });

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'move') {
      players[id] = { x: data.x, y: data.y };
      broadcast(ws, { type: 'playerMove', id, x: data.x, y: data.y });
    }
  });

  ws.on('close', () => {
    delete players[id];
    broadcastAll({ type: 'playerLeft', id });
  });
});

// Mandar a todos MENOS al remitente
function broadcast(sender, data) {
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Mandar a TODOS incluyendo el remitente
function broadcastAll(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}