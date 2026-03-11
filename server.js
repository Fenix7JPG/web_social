const express = require('express');
const WebSocket = require('ws');
const app = express();

// ✅ LA VARIABLE COMPARTIDA - vive en el servidor
let sharedVariable = "Hola mundo";

app.use(express.static('public'));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor corriendo en puerto', process.env.PORT || 3000);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Nuevo cliente conectado');

  // Cuando alguien se conecta, le mandamos el valor actual
  ws.send(JSON.stringify({ type: 'update', value: sharedVariable }));

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'change') {
      // Actualizar la variable en el servidor
      sharedVariable = data.value;
      console.log('Variable cambiada a:', sharedVariable);

      // Mandar el nuevo valor a TODOS los clientes conectados
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'update', value: sharedVariable }));
        }
      });
    }
  });

  ws.on('close', () => console.log('Cliente desconectado'));
});