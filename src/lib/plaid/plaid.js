const moment = require('moment');
const { getConfigEnv, writeConfigProperty } = require('../common');

getConfigEnv();

const plaidClient = require('./plaidClient');

// start from beginning of last month...
const startDate = moment()
  .subtract(1, 'month')
  .startOf('month')
  .format('YYYY-MM-DD');
// ends now.
// this ensures we always fully update last month,
// and keep current month up-to-date
const endDate = moment().format('YYYY-MM-DD');

const transactionFetchOptions = [
  startDate,
  endDate,
  {
    count: 500,
    offset: 0
  }
];

const getPlaidAccountTokens = () => {
  return Object.keys(process.env)
    .filter(key => key.startsWith(`PLAID_TOKEN`))
    .map(key => ({
      account: key.replace(/^PLAID_TOKEN_/, ''),
      token: process.env[key]
    }));
};

const fetchTransactions = async () => {
  console.log('Fetching Transactions...');

  const rawTransactions = await Promise.all(
    getPlaidAccountTokens().map(({ account, token }) => {
      return plaidClient
        .getTransactions(token, ...transactionFetchOptions)
        .then(({ transactions }) => ({
          account,
          transactions
        }))
        .catch(error => {
          console.log(`Error fetching transactions for account ${account}:\n`, error);
          process.exit(1);
        });
    })
  );

  // concat all transactions
  const transactions = rawTransactions.reduce((all, { account, transactions }) => {
    return all.concat(
      transactions.map(transaction => {
        return {
          ...transaction,
          amount: -transaction.amount,
          account: account
        };
      })
    );
  }, []);

  if (transactions.length >= 500) {
    console.error('Error: More than 500 transactions for this month!');
    process.exit(1);
  }

  return transactions;
};

const fetchBalances = async options => {
  console.log('Fetching Account Balances...');
  return await Promise.all(
    getPlaidAccountTokens().map(({ account, token }) => {
      return plaidClient
        .getBalance(token)
        .then(data => {
          return {
            ...data,
            nickname: account
          };
        })
        .catch(error => {
          const message = `Error fetching balances for account ${account} – ${error.error_code}`;
          console.log(message);
          if (options.quiet && options.quiet === true) {
            return { nickname: account, error: message };
          } else {
            process.exit(1);
          }
        });
    })
  );
};

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
const saveAccessToken = async (public_token, accountNickname) => {
  return await Promise(
    plaidClient.exchangePublicToken(public_token, (error, tokenResponse) => {
      if (error) {
        return error.message;
      } else {
        writeConfigProperty(`PLAID_TOKEN_${accountNickname.toUpperCase()}`, tokenResponse.access_token);
        return null;
      }
    })
  );
};

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
const createPublicToken = async access_token => {
  return await Promise(
    plaidClient.createPublicToken(body.token, (error, tokenResponse) => {
      if (error) {
        return error.message;
      } else {
        writeConfigProperty(`PLAID_TOKEN_${body.accountNickname.toUpperCase()}`, tokenResponse.access_token);
        return null;
      }
    })
  );
};

module.exports = {
  getPlaidAccountTokens,
  fetchBalances,
  fetchTransactions,
  saveAccessToken
};
