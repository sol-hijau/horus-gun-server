const express = require('express');
const Gun = require('gun');
const app = express();

const port = process.env.PORT;
const serviceType = process.env.SERVICE_TYPE; // 'admin' or 'platform'

const server = app.listen(port, () => {
  console.log(`${serviceType} DB server on port ${port}`);
});

const gun = Gun({
  file: false,
  web: server,
  peers: []
});

// Load data based on service type
if (serviceType === 'admin') {
  gun.get('horus/admin').put({
    ui_texts: {
      "admin_title": "Horus Admin",
      // ... admin data
    },
    version: "1.0.0"
  });
} else {
  gun.get('horus/platform').put({
    content: `<!DOCTYPE html>...`,
    version: "1.0.0" 
  });
}

app.get('/health', (req, res) => res.send('OK'));
app.use('/', (req, res) => res.send(`${serviceType} DB Server`));