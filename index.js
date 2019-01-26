require("dotenv").config();
const _ = require("lodash");
const moment = require('moment')

const { fetchTransactions } = require("./lib/fetch");
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
  const additional_columns = [
    'work',
    'joint',
    'paid'
  ]

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const firstCol = alphabet[0]
  const lastCol = alphabet[properties.length - 1]
  const firstAddCol = alphabet[properties.length]
  const lastAddCol = alphabet[properties.length + additional_columns.length - 1]

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

  await clearSheet(`${currentMonthSheet}!${firstCol}:${lastCol}`)
  await clearSheet(`${lastMonthSheet}!${firstCol}:${lastCol}`)

  const sorted = _.sortBy(transactions, 'date');

  const partitioned = _.partition(sorted, transaction => {
    return moment(transaction.date).startOf('month').format('YYYY.MM') === currentMonthSheet
  });

  const transformTransactionsToUpdates = (sheetTitle, transactions) => {
    const updates = _.map(transactions, (transaction, i) => {
      return {
        range: `${sheetTitle}!${firstCol}${i + 2}:${lastCol}${i + 2}`,
        values: [_.map(properties, (property) => {
          let value = _.get(transaction, property, '');
          value = value === true ? 'y' : value;
          value = value === false ? null : value;
          return value;
        })]
      }
    })

    updates.push({
      range: `${sheetTitle}!${firstCol}1:${lastCol}1`,
      values: [properties]
    })

    updates.push({
      range: `${sheetTitle}!${firstAddCol}1:${lastAddCol}1`,
      values: [additional_columns]
    })

    return updates
  }

  updateSheet(transformTransactionsToUpdates(currentMonthSheet, partitioned[0]));
  updateSheet(transformTransactionsToUpdates(lastMonthSheet, partitioned[1]));
})();
