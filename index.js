require("dotenv").config();
const _ = require("lodash");

const { fetchTransactions } = require("./lib/fetch");
const { transformTransactionsToUpdates } = require("./lib/transform");
const { updateSheet, addSheet, clearSheet, getSheets } = require("./lib/update");

(async () => {
  console.log("Fetching Transactions...");

  const transactions = await _.sortBy(fetchTransactions(), "date");

  if (transactions.length >= 500) {
    console.error("More than 500 transactions for this month!");
  }

  const sheets = await getSheets();
  const updates = transformTransactionsToUpdates(transactions);
  console.log(sheets);
  clearSheet("Sheet1");
  updateSheet(updates);
  // addSheet('asdfasdf')
})();
