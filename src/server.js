const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const opn = require('opn');
const fs = require('fs');
const util = require('util');
const moment = require('moment');
const { fetchBalances } = require('./lib/plaid/plaid');
const { getConfigEnv, CONFIG_FILE } = require('./lib/common');

try {
  const port = parseInt(process.env.PORT, 10) || 3000;
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();

  let PUBLIC_TOKEN = null;
  let ITEM_ID = null;

  let config = getConfigEnv();

  const plaidClient = require('./lib/plaid/plaidClient')(
    process.env.PLAID_CLIENT_ID,
    process.env.PLAID_SECRET,
    process.env.PLAID_PUBLIC_KEY
  );

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
        } else {
          res.json(JSON.parse(data));
        }
      });
    });

    server.put('/config', (req, res) => {
      const newConfig = {
        ...config,
        [req.body.propertyId]: req.body.value
      };

      fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), err => {
        if (err) {
          const message = 'Error: Could not write config file. ' + err.message;
          console.log(message);
          res.status(400).send(message);
        } else {
          config = getConfigEnv();
          res.status(201).send('Successfully wrote config.');
        }
      });
    });

    account = 'cap-one';
    server.get('/connect', (req, res, next) => {
      res.render('plaid.ejs', {
        PLAID_ACCOUNT: account,
        PLAID_PUBLIC_KEY: process.env.PLAID_PUBLIC_KEY
      });
    });

    server.get('/balances', async (req, res, next) => {
      try {
        const balances = await fetchBalances();
        res.json(balances);
      } catch (e) {
        console.log(e);
      }
    });

    function saveAccessToken(token) {
      console.log();
      console.log(`Saving access token for account "${account}": ${token}`);
      saveEnv({
        [`PLAID_TOKEN_${account}`]: token
      });
      console.log('Saved.');
      console.log();
    }

    // Exchange token flow - exchange a Link public_token for
    // an API access_token
    // https://plaid.com/docs/#exchange-token-flow
    server.post('/get_access_token', function(request, response, next) {
      PUBLIC_TOKEN = request.body.public_token;
      plaidClient.exchangePublicToken(PUBLIC_TOKEN, function(error, tokenResponse) {
        if (error != null) {
          prettyPrintResponse(error);
          return response.json({
            error: error
          });
        }
        ACCESS_TOKEN = tokenResponse.access_token;
        saveAccessToken(ACCESS_TOKEN);
        ITEM_ID = tokenResponse.item_id;
        prettyPrintResponse(tokenResponse);
        response.json({
          access_token: ACCESS_TOKEN,
          item_id: ITEM_ID,
          error: null
        });
      });
    });

    // Retrieve Transactions for an Item
    // https://plaid.com/docs/#transactions
    server.get('/transactions', function(request, response, next) {
      // Pull transactions for the Item for the last 30 days
      var startDate = moment()
        .subtract(30, 'days')
        .format('YYYY-MM-DD');
      var endDate = moment().format('YYYY-MM-DD');
      plaidClient.getTransactions(
        ACCESS_TOKEN,
        startDate,
        endDate,
        {
          count: 250,
          offset: 0
        },
        function(error, transactionsResponse) {
          if (error != null) {
            prettyPrintResponse(error);
            return response.json({
              error: error
            });
          } else {
            prettyPrintResponse(transactionsResponse);
            response.json({ error: null, transactions: transactionsResponse });
          }
        }
      );
    });

    // Retrieve Identity for an Item
    // https://plaid.com/docs/#identity
    server.get('/identity', function(request, response, next) {
      plaidClient.getIdentity(ACCESS_TOKEN, function(error, identityResponse) {
        if (error != null) {
          prettyPrintResponse(error);
          return response.json({
            error: error
          });
        }
        prettyPrintResponse(identityResponse);
        response.json({ error: null, identity: identityResponse });
      });
    });

    // Retrieve real-time Balances for each of an Item's accounts
    // https://plaid.com/docs/#balance
    server.get('/balance', function(request, response, next) {
      plaidClient.getBalance(ACCESS_TOKEN, function(error, balanceResponse) {
        if (error != null) {
          prettyPrintResponse(error);
          return response.json({
            error: error
          });
        }
        prettyPrintResponse(balanceResponse);
        response.json({ error: null, balance: balanceResponse });
      });
    });

    // Retrieve an Item's accounts
    // https://plaid.com/docs/#accounts
    server.get('/accounts', function(request, response, next) {
      plaidClient.getAccounts(ACCESS_TOKEN, function(error, accountsResponse) {
        if (error != null) {
          prettyPrintResponse(error);
          return response.json({
            error: error
          });
        }
        prettyPrintResponse(accountsResponse);
        response.json({ error: null, accounts: accountsResponse });
      });
    });

    // Retrieve ACH or ETF Auth data for an Item's accounts
    // https://plaid.com/docs/#auth
    server.get('/auth', function(request, response, next) {
      plaidClient.getAuth(ACCESS_TOKEN, function(error, authResponse) {
        if (error != null) {
          prettyPrintResponse(error);
          return response.json({
            error: error
          });
        }
        prettyPrintResponse(authResponse);
        response.json({ error: null, auth: authResponse });
      });
    });

    // Retrieve information about an Item
    // https://plaid.com/docs/#retrieve-item
    server.get('/item', function(request, response, next) {
      // Pull the Item - this includes information about available products,
      // billed products, webhook information, and more.
      plaidClient.getItem(ACCESS_TOKEN, function(error, itemResponse) {
        if (error != null) {
          prettyPrintResponse(error);
          return response.json({
            error: error
          });
        }
        // Also pull information about the institution
        plaidClient.getInstitutionById(itemResponse.item.institution_id, function(err, instRes) {
          if (err != null) {
            var msg = 'Unable to pull institution information from the Plaid API.';
            console.log(msg + '\n' + JSON.stringify(error));
            return response.json({
              error: msg
            });
          } else {
            prettyPrintResponse(itemResponse);
            response.json({
              item: itemResponse.item,
              institution: instRes.institution
            });
          }
        });
      });
    });

    var prettyPrintResponse = response => {
      console.log(util.inspect(response, { colors: true, depth: 4 }));
    };

    server.post('/set_access_token', function(request, response, next) {
      ACCESS_TOKEN = request.body.access_token;
      plaidClient.getItem(ACCESS_TOKEN, function(error, itemResponse) {
        response.json({
          item_id: itemResponse.item.item_id,
          error: false
        });
      });
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
