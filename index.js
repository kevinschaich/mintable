require("dotenv").config();
const _ = require("lodash");
const moment = require('moment')

const { fetchTransactions } = require("./lib/fetch");
const { transformTransactionsToUpdates } = require("./lib/transform");
const { updateSheet, addSheet, clearSheet, getSheets } = require("./lib/update");

(async () => {
  const properties = [
    'date',
    'amount',
    'name',
    'account',
    'category.0',
    'category.1',
    'pending',
  ]

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const firstCol = alphabet[0]
  const lastCol = alphabet[properties.length - 1]
  const transactionColumns = `${firstCol}:${lastCol}`

  const currentMonth = moment().startOf('month');
  const lastMonth = moment().subtract(1, 'month').startOf('month');

  const currentMonthSheet = currentMonth.format('YYYY.MM');
  const lastMonthSheet = lastMonth.format('YYYY.MM');

  console.log("Fetching Transactions...");

  const transactions = await fetchTransactions();

  const sheets = await getSheets();
  const sheetTitles = _.map(sheets, sheet => sheet.properties.title);

  if (!_.includes(sheetTitles, lastMonthSheet)) {
    await addSheet(lastMonthSheet);
  }
  if (!_.includes(sheetTitles, currentMonthSheet)) {
    await addSheet(currentMonthSheet);
  }

  await clearSheet(`${currentMonthSheet}!${transactionColumns}`)
  await clearSheet(`${lastMonthSheet}!${transactionColumns}`)

  const sorted = _.sortBy(transactions, 'date');

  const partitioned = _.partition(sorted, transaction => {
    return moment(transaction.date).startOf('month').format('YYYY.MM') === currentMonthSheet
  });

  updateSheet(transformTransactionsToUpdates(currentMonthSheet, partitioned[0], properties, firstCol, lastCol));
  updateSheet(transformTransactionsToUpdates(lastMonthSheet, partitioned[1], properties, firstCol, lastCol));
})();
