const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const fs = require('fs');
const CONFIG_FILE = __dirname + '/../../mintable.config.json';

app.prepare().then(() => {
  const server = express();
  server.use(bodyParser.urlencoded({ extended: false }));
  server.use(bodyParser.json());

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
    console.log("BODY", req.body);
    fs.writeFile(CONFIG_FILE, JSON.stringify(req.body, null, 2), (err) => {
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
