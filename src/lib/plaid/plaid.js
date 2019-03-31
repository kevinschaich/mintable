const moment = require("moment");
const common = require("../common");

common.getConfigEnv();

const plaidClient = require('./plaidClient')(
  process.env.PLAID_CLIENT_ID,
  process.env.PLAID_SECRET,
  process.env.PLAID_PUBLIC_KEY
);

// start from beginning of last month...
const startDate = moment()
  .subtract(1, "month")
  .startOf("month")
  .format("YYYY-MM-DD");
// ends now.
// this ensures we always fully update last month,
// and keep current month up-to-date
const endDate = moment().format("YYYY-MM-DD");

const transactionFetchOptions = [
  startDate,
  endDate,
  {
    count: 500,
    offset: 0
  }
];

const plaidAccountTokens = Object.keys(process.env)
  .filter(key => key.startsWith(`PLAID_TOKEN`))
  .map(key => ({
    account: key.replace(/^PLAID_TOKEN_/, ""),
    token: process.env[key]
  }));

exports.fetchTransactions = async function() {
  console.log("Fetching Transactions...");

  const rawTransactions = await Promise.all(
    plaidAccountTokens.map(({ account, token }) => {
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
    console.error("Error: More than 500 transactions for this month!");
    process.exit(1);
  }

  return transactions;
};

exports.fetchBalances = async function() {
  console.log("Fetching Account Balances...");
  return await Promise.all(
    plaidAccountTokens.map(({ account, token }) => {
      return plaidClient
        .getBalance(token)
        .then(data => {
          return data;
        })
        .catch(error => {
          console.log(`Error fetching balances for account ${account}:\n`, error);
          process.exit(1);
        });
    })
  );
};
