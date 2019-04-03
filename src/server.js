const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const opn = require('opn');
const {
  getConfigEnv,
  writeConfigProperty,
  maybeWriteDefaultConfig,
  accountsSetupCompleted,
  sheetsSetupCompleted
} = require('./lib/common');
const _ = require('lodash');

try {
  const port = parseInt(process.env.PORT, 10) || 3000;
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    maybeWriteDefaultConfig();
    getConfigEnv();

    const server = express();
    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());

    const oAuth2Client = require('./lib/google/googleClient');

    server.get('/config', (req, res) => {
      const readResult = getConfigEnv();
      if (readResult === false) {
        res.status(400).send('Error: Could not read config file.');
      } else {
        res.json({
          ...readResult,
          accountsSetupCompleted: accountsSetupCompleted(),
          sheetsSetupCompleted: sheetsSetupCompleted()
        });
      }
    });

    server.put('/config', async (req, res) => {
      const writeStatus = writeConfigProperty(req.body.id, req.body.value);
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
          case 'plaid':
            const plaid = require('./lib/plaid/plaid');
            balances = await plaid.fetchBalances({ quiet: true });
            break;
          default:
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
        case 'plaid':
          const plaid = require('./lib/plaid/plaid');
          error = await plaid.saveAccessToken(req.body.public_token, req.body.accountNickname);
          break;
        default:
          break;
      }

      if (error) {
        res.status(400).send('Error: Could not get access token.' + error.message);
      } else {
        res.status(201).send('Saved access token.');
      }
    });

    server.get('/google-sheets-url', (req, res) => {
      res.json({
        url: oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/spreadsheets']
        })
      });
    });

    server.get('/google-sheets-oauth2callback', (req, res) => {
      const code = req.query.code;
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          const message = 'Error while trying to retrieve access token' + err.message;
          console.log(message);
          res.status(400).send(message);
        } else {
          Object.keys(token).forEach(key => {
            writeConfigProperty(`SHEETS_${key.toUpperCase()}`, token[key]);
          });
          console.log(`Token stored in .env.`);
          res.redirect('http://localhost:3000/sheets');
        }
      });
    });

    server.get('/', (req, res) => {
      const page = accountsSetupCompleted() && sheetsSetupCompleted() ? 'settings' : 'welcome';
      return res.redirect(`http://localhost:3000/${page}`);
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
