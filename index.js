require("dotenv").config();
const _ = require("lodash");
const moment = require('moment')

const { fetchTransactions } = require("./lib/fetch");
const { transformTransactionsToUpdates } = require("./lib/transform");
const { updateSheet, addSheet, clearSheet, getSheets } = require("./lib/update");
const { transactionColumns } = require('./lib/constants')

const currentMonth = moment().startOf('month');
const lastMonth = moment().subtract(1, 'month').startOf('month');

const currentMonthSheet = currentMonth.format('YYYY.MM');
const lastMonthSheet = lastMonth.format('YYYY.MM');

(async () => {
  console.log("Fetching Transactions...");

  const transactions = await fetchTransactions();

  const sheets = await getSheets();
  const sheetTitles = _.map(sheets, sheet => sheet.properties.title);

  if (!_.includes(sheetTitles, lastMonthSheet)) {
    addSheet(lastMonthSheet);
  }
  if (!_.includes(sheetTitles, currentMonthSheet)) {
    addSheet(currentMonthSheet);
  }

  clearSheet(`${currentMonthSheet}!${transactionColumns}`)
  clearSheet(`${lastMonthSheet}!${transactionColumns}`)

  const sorted = _.sortBy(transactions, 'date');

  const partitioned = _.partition(sorted, transaction => {
    return moment(transaction.date).startOf('month').format('YYYY.MM') === currentMonthSheet
  });

  updateSheet(transformTransactionsToUpdates(currentMonthSheet, partitioned[0]));
  updateSheet(transformTransactionsToUpdates(lastMonthSheet, partitioned[1]));
  // addSheet('asdfasdf')
})();
