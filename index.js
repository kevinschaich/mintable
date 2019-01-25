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

  const sheets = await getSheets();
  const sheetTitles = _.map(sheets, sheet => sheet.properties.title);

  if (! _.includes(sheetTitles, lastMonth)) {
    addSheet(lastMonth);
  }
  if (!_.includes(sheetTitles, month)) {
    addSheet(month);
  }

  const transactionsWithDateObjects = _.sortBy(_.map(transactions, transaction => {
    return {
      ...transaction,
      date: moment(transaction.date)
    }
  }), 'date');
  console.log(transactionsWithDateObjects)
  console.log(month);
  // clearSheet("Sheet1");  

  const updates = transformTransactionsToUpdates("2019.01", _.sortBy(transactions, "date"));
  updateSheet(updates);
  // addSheet('asdfasdf')
})();
