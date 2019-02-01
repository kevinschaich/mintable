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

  const defaultTransactionColumns = ['date', 'amount', 'name', 'account', 'category.0', 'category.1', 'pending'];
  const defaultReferenceColumns = ['notes', 'work', 'joint'];
  const transactionColumns = JSON.parse(process.env.TRANSACTION_COLUMNS || null) || defaultTransactionColumns;
  const referenceColumns = JSON.parse(process.env.REFERENCE_COLUMNS || null) || defaultReferenceColumns;
  const categoryOverrides = JSON.parse(process.env.CATEGORY_OVERRIDES || null) || [];

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const firstTransactionColumn = alphabet[0];
  const lastTransactionColumn = alphabet[transactionColumns.length - 1];
  const firstReferenceColumn = alphabet[transactionColumns.length];
  const lastReferenceColumn = alphabet[transactionColumns.length + referenceColumns.length - 1];
  const numAutomatedColumns = transactionColumns.length + referenceColumns.length;

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
    await clearSheet(`${currentMonthSheetTitle}!${firstTransactionColumn}:${lastReferenceColumn}`);
  }

  await clearSheet(`${currentMonthSheetTitle}!${firstTransactionColumn}:${lastTransactionColumn}`);
  await clearSheet(`${lastMonthSheetTitle}!${firstTransactionColumn}:${lastTransactionColumn}`);

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // FETCH TRANSACTIONS AND MAP TO SHEET UPDATES
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const sanitizeTransaction = transaction => {
    /* 
    * Explode out Plaid's object hierarchy.
    * 
    * For example, the Category hierarchy comes as a list,
    * and the first two are usually the only interesting ones.
    * 
    * Using defaultTransactionColumns above and _.get():
    * 
    *    { "category": ["Food and Drink", "Restaurants"] }
    *
    * would get expanded to:
    * 
    *    { "category.0": "Food and Drink", "category.1": "Restaurants" }
    */
    _.forEach(transactionColumns, column => {
      transaction[column] = _.get(transaction, column);
    })

    // Map TRUE to 'y' and FALSE to nothing (used for Pending column)
    transaction = _.mapValues(transaction, property => {
      property = property === true ? 'y' : property;
      property = property === false ? '' : property;
      return property;
    });

    // Handle category overrides defined in .env
    _.forEach(categoryOverrides, override => {
      if (new RegExp(override.pattern, _.get(override, 'flags', '')).test(transaction.name)) {
        transaction['category.0'] = _.get(override, 'category.0', '');
        transaction['category.1'] = _.get(override, 'category.1', '');
      }
    });

    return _.at(transaction, transactionColumns)
  }

  const transformTransactionsToUpdates = (sheetTitle, transactions) => {
    // Transaction data (rows 2 onwards)
    const updates = _.map(transactions, (transaction, i) => {
      const range = `${sheetTitle}!${firstTransactionColumn}${i + 2}:${lastTransactionColumn}${i + 2}`;
      const values = [sanitizeTransaction(transaction)];
      return { range, values };
    });

    // Column headers for transaction data
    updates.push({
      range: `${sheetTitle}!${firstTransactionColumn}1:${lastTransactionColumn}1`,
      values: [transactionColumns]
    });

    // Additional user-defined reference column headers (specify in .env)
    updates.push({
      range: `${sheetTitle}!${firstReferenceColumn}1:${lastReferenceColumn}1`,
      values: [referenceColumns]
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

  await resizeColumns(currentMonthSheet.properties.sheetId, numAutomatedColumns);
  await resizeColumns(lastMonthSheet.properties.sheetId, numAutomatedColumns);
})();
