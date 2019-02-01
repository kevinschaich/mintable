require('dotenv').config();
const _ = require('lodash');
const moment = require('moment');

const { fetchTransactions } = require('./lib/plaid');
const {
  updateSheet,
  addSheet,
  clearSheet,
  getSheets,
  formatHeaderRow,
  resizeColumns,
  duplicateSheet,
  renameSheet
} = require('./lib/sheets');

(async () => {

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // CONSTANT DEFINITIONS
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const properties = ['date', 'amount', 'name', 'account', 'category.0', 'category.1', 'pending'];
  const additional_columns = ['notes', 'work', 'joint'];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const firstCol = alphabet[0];
  const lastCol = alphabet[properties.length - 1];
  const firstAddCol = alphabet[properties.length];
  const lastAddCol = alphabet[properties.length + additional_columns.length - 1];
  const currentMonth = moment().startOf('month');
  const lastMonth = moment()
    .subtract(1, 'month')
    .startOf('month');
  const currentMonthSheetTitle = currentMonth.format('YYYY.MM');
  const lastMonthSheetTitle = lastMonth.format('YYYY.MM');

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // SET UP SHEETS FOR CURRENT/LAST MONTH'S TRANSACTIONS
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const sheets = await getSheets();
  let currentMonthSheet = _.find(sheets, sheet => sheet.properties.title === currentMonthSheetTitle);
  let lastMonthSheet = _.find(sheets, sheet => sheet.properties.title === lastMonthSheetTitle);

  if (!lastMonthSheet) {
    lastMonthSheet = await addSheet(lastMonthSheetTitle);
  }
  if (!currentMonthSheet) {
    currentMonthSheet = await duplicateSheet(lastMonthSheet.properties.sheetId);
    await renameSheet(currentMonthSheet.properties.sheetId, currentMonthSheetTitle);
    await clearSheet(`${currentMonthSheetTitle}!${firstCol}:${lastAddCol}`);
  }

  await clearSheet(`${currentMonthSheetTitle}!${firstCol}:${lastCol}`);
  await clearSheet(`${lastMonthSheetTitle}!${firstCol}:${lastCol}`);

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // FETCH TRANSACTIONS AND MAP TO SHEET UPDATES
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const sanitizeTransaction = transaction => {
    // Explode Plaid's category hierarchy – first two are usually the only interesting ones
    transaction['category.0'] = transaction.category[0]
    transaction['category.1'] = transaction.category[1]

    // Map TRUE to 'y' and FALSE to nothing (used for Pending column)
    transaction = _.mapValues(transaction, property => {
      property = property === true ? 'y' : property;
      property = property === false ? '' : property;
      return property;
    });

    // Handle category overrides defined in .env
    const categoryOverrides = process.env.CATEGORY_OVERRIDES ? JSON.parse(process.env.CATEGORY_OVERRIDES) : []
    _.forEach(categoryOverrides, override => {
      if (new RegExp(override.pattern, _.get(override, 'flags', '')).test(transaction.name)) {
        transaction['category.0'] = _.get(override, 'category.0', '');
        transaction['category.1'] = _.get(override, 'category.1', '');
      }
    });

    return _.at(transaction, properties)
  }

  const transformTransactionsToUpdates = (sheetTitle, transactions) => {
    // Transaction data (rows 2 onwards)
    const updates = _.map(transactions, (transaction, i) => {
      const range = `${sheetTitle}!${firstCol}${i + 2}:${lastCol}${i + 2}`;
      const values = [sanitizeTransaction(transaction)];
      return { range, values };
    });

    // Column headers for transaction data
    updates.push({
      range: `${sheetTitle}!${firstCol}1:${lastCol}1`,
      values: [properties]
    });

    // Additional user-defined column headers (specify above in additional_columns)
    updates.push({
      range: `${sheetTitle}!${firstAddCol}1:${lastAddCol}1`,
      values: [additional_columns]
    });

    return updates;
  };

  const transactions = await fetchTransactions();
  const sorted = _.sortBy(transactions, 'date');
  const partitioned = _.partition(sorted, transaction => {
    return (
      moment(transaction.date)
        .startOf('month')
        .format('YYYY.MM') === currentMonthSheetTitle
    );
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // UPDATE SHEETS & FORMATTING
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  await updateSheet(transformTransactionsToUpdates(currentMonthSheetTitle, partitioned[0]));
  await updateSheet(transformTransactionsToUpdates(lastMonthSheetTitle, partitioned[1]));

  await formatHeaderRow(currentMonthSheet.properties.sheetId);
  await formatHeaderRow(lastMonthSheet.properties.sheetId);

  const numDataColumns = properties.length + additional_columns.length;
  await resizeColumns(currentMonthSheet.properties.sheetId, numDataColumns);
  await resizeColumns(lastMonthSheet.properties.sheetId, numDataColumns);
})();
