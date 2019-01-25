require("dotenv").config();
const _ = require("lodash");

const { fetchTransactions } = require("./lib/fetch");
const { transformTransactionsToUpdates } = require("./lib/transform");
const { updateSheet, addSheet, clearSheet, getSheets } = require("./lib/update");

(async () => {
  console.log("Fetching Transactions...");

  const transactions = await fetchTransactions();
  // console.log(transactions)

  const sheets = await getSheets();
  const updates = transformTransactionsToUpdates(_.sortBy(transactions, "date"));
  // console.log(updates)
  // console.log(sheets); 
  // clearSheet("Sheet1");  
  updateSheet(updates);
  // addSheet('asdfasdf')
})();
