const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const opn = require('opn');
const fs = require('fs');
const util = require('util');
const moment = require('moment');

try {
  const port = parseInt(process.env.PORT, 10) || 3000;
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();

  const CONFIG_FILE = '../mintable.config.json';
  let PUBLIC_TOKEN = null;
  let ITEM_ID = null;

  const config = fs.readFileSync(CONFIG_FILE);

  process.env = {
    ...process.env,
    ...JSON.parse(config)
  };

  console.log(process.env);
  
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
      fs.writeFile(CONFIG_FILE, JSON.stringify(req.body, null, 2), err => {
        if (err) {
          const message = 'Error: Could not write config file. ' + err.message;
          console.log(message);
          res.status(400).send(message);
        } else {
          res.status(201).send('Successfully wrote config.');
        }
      });
    });

    account = 'cap-one';
    server.get('/accounts', (req, res, next) => {
      res.render('plaid.ejs', {
        PLAID_ACCOUNT: account,
        PLAID_PUBLIC_KEY: process.env.PLAID_PUBLIC_KEY
      });
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

    // Create and then retrieve an Asset Report for one or more Items. Note that an
    // Asset Report can contain up to 100 items, but for simplicity we're only
    // including one Item here.
    // https://plaid.com/docs/#assets
    server.get('/assets', function(request, response, next) {
      // You can specify up to two years of transaction history for an Asset
      // Report.
      var daysRequested = 10;

      // The `options` object allows you to specify a webhook for Asset Report
      // generation, as well as information that you want included in the Asset
      // Report. All fields are optional.
      var options = {
        client_report_id: 'Custom Report ID #123',
        // webhook: 'https://your-domain.tld/plaid-webhook',
        user: {
          client_user_id: 'Custom User ID #456',
          first_name: 'Alice',
          middle_name: 'Bobcat',
          last_name: 'Cranberry',
          ssn: '123-45-6789',
          phone_number: '555-123-4567',
          email: 'alice@example.com'
        }
      };
      plaidClient.createAssetReport([ACCESS_TOKEN], daysRequested, options, function(error, assetReportCreateResponse) {
        if (error != null) {
          prettyPrintResponse(error);
          return response.json({
            error: error
          });
        }
        prettyPrintResponse(assetReportCreateResponse);

        var assetReportToken = assetReportCreateResponse.asset_report_token;
        respondWithAssetReport(20, assetReportToken, plaidClient, response);
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

    // This is a helper function to poll for the completion of an Asset Report and
    // then send it in the response to the client. Alternatively, you can provide a
    // webhook in the `options` object in your `/asset_report/create` request to be
    // notified when the Asset Report is finished being generated.
    var respondWithAssetReport = (numRetriesRemaining, assetReportToken, client, response) => {
      if (numRetriesRemaining == 0) {
        return response.json({
          error: 'Timed out when polling for Asset Report'
        });
      }

      client.getAssetReport(assetReportToken, function(error, assetReportGetResponse) {
        if (error != null) {
          prettyPrintResponse(error);
          if (error.error_code == 'PRODUCT_NOT_READY') {
            setTimeout(() => respondWithAssetReport(--numRetriesRemaining, assetReportToken, client, response), 1000);
            return;
          }

          return response.json({
            error: error
          });
        }

        client.getAssetReportPdf(assetReportToken, function(error, assetReportGetPdfResponse) {
          if (error != null) {
            return response.json({
              error: error
            });
          }

          response.json({
            error: null,
            json: assetReportGetResponse.report,
            pdf: assetReportGetPdfResponse.buffer.toString('base64')
          });
        });
      });
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
