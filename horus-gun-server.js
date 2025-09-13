const express = require('express');
const Gun = require('gun');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 8765;
const server = http.createServer(app);

// Create separate Gun instances
const adminGun = Gun({ file: false, web: server, peers: [], radisk: false });
const platformGun = Gun({ file: false, web: server, peers: [], radisk: false });

// Initialize data
adminGun.get('horus/admin').put({
  ui_texts: {"admin_title": "Horus Admin", "register_button": "Register Admin"},
  version: "1.0.0"
});

platformGun.get('horus/platform').put({
  content: `<!DOCTYPE html><html><title>Horus Platform</title></html>`,
  version: "1.0.0"
});

// WebSocket path routing
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws, request) => {
  const path = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (path === '/admin') adminGun.ws(ws);
  else if (path === '/platform') platformGun.ws(ws);
  else ws.close();
});

// Health endpoint
app.get('/health', (req, res) => res.send('OK'));
app.use('/', (req, res) => res.send('Horus Combined DB Server'));

server.listen(port, () => console.log(`Server running on port ${port}`));