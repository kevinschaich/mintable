require("dotenv").config();
const _ = require("lodash");

const { fetchTransactions } = require("./lib/fetch");
const { transformTransactionsToUpdates } = require("./lib/transform");
const { updateSheet, addSheet, clearSheet, getSheets } = require("./lib/update");

(async () => {
  console.log("Fetching Transactions...");

  const transactions = await fetchTransactions();

  const sheets = await getSheets();
  console.log(sheets); 
  const updates = transformTransactionsToUpdates(_.sortBy(transactions, "date"));
  // console.log(updates)
  // clearSheet("Sheet1");  
  updateSheet(updates);
  // addSheet('asdfasdf')
})();
