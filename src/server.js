const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const opn = require('opn');
const plaid = require('./lib/plaid/plaid');
const { getConfigEnv, writeConfigProperty } = require('./lib/common');

try {
  const port = parseInt(process.env.PORT, 10) || 3000;
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();

  getConfigEnv();

  app.prepare().then(() => {
    const server = express();
    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());

    server.get('/config', (req, res) => {
      const readResult = getConfigEnv();
      if (readResult === false) {
        res.status(400).send('Error: Could not read config file.');
      } else {
        res.json(readResult);
      }
    });

    server.put('/config', async (req, res) => {
      const writeStatus = writeConfigProperty(req.body.propertyId, req.body.value);
      if (writeStatus === false) {
        res.status(400).send('Error: Could not write config file.');
      } else {
        res.status(201).send('Successfully wrote config file.');
      }
    });

    server.get('/balances', async (req, res, next) => {
      try {
        let balances;

        switch (process.env.TRANSACTION_PROVIDER) {
          default:
            balances = await plaid.fetchBalances(true);
            break;
        }

        res.json(balances || {});
      } catch (e) {
        console.log(e);
      }
    });

    server.post('/token', async (req, res, next) => {
      let error;

      switch (process.env.TRANSACTION_PROVIDER) {
        default:
          error = await plaid.saveAccessToken();
          break;
      }

      if (error) {
        res.status(400).send('Error: Could not get access token.' + error.message);
      }
      else {
        res.status(201).send('Saved access token.');
      }
    });

    server.get('*', (req, res) => {
      return handle(req, res);
    });

    server.listen(port, err => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);

      opn(`http://localhost:${port}`);
    });
  });
} catch (e) {
  console.log(e);
}
