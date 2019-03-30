const express = require('express');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const fs = require('fs');
const CONFIG_FILE = process.argv[2] || '../mintable.config.json';

app.prepare().then(() => {
  const server = express();

  server.get('/config', (req, res) => {
    fs.readFile(CONFIG_FILE, (err, data) => {
      if (err) {
        const message = 'Error: Could not parse config file. ' + err.message;
        console.log(message);
        res.status(400).send(message);
      }
      else {
        res.json(JSON.parse(data));
      }
    });
  });

  server.put('/config', (req, res) => {
    fs.writeFile(CONFIG_FILE, (err) => {
      if (err) {
        const message = 'Error: Could not write config file. ' + err.message;
        console.log(message);
        res.status(400).send(message);
      }
      else {
        res.status(201).send("Successfully wrote config.");
      }
    });
  });

  server.get('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
