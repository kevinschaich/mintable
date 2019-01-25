require("dotenv").config();
const _ = require("lodash");
const moment = require('moment')

const { fetchTransactions } = require("./lib/fetch");
const { transformTransactionsToUpdates } = require("./lib/transform");
const { updateSheet, addSheet, clearSheet, getSheets } = require("./lib/update");

const month = moment().startOf('month').format('YYYY.MM');
const lastMonth = moment().subtract(1, 'month').startOf('month').format('YYYY.MM');

(async () => {
  console.log("Fetching Transactions...");

  const transactions = await fetchTransactions();
  const updates = transformTransactionsToUpdates("2019.01", _.sortBy(transactions, "date"));

  const sheets = await getSheets();
  const sheetTitles = _.map(sheets, sheet => sheet.properties.title);

  if (! _.includes(sheetTitles, lastMonth)) {
    addSheet(lastMonth);
  }
  if (!_.includes(sheetTitles, month)) {
    addSheet(month);
  }

  console.log(month);
  // clearSheet("Sheet1");  
  updateSheet(updates);
  // addSheet('asdfasdf')
})();
