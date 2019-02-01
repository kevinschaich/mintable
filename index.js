require('dotenv').config();
const moment = require('moment');
const { updateSheets } = require('./providers/sheets');
const { getTransactions } = require('./providers/plaid');

(async () => {
  const defaultTransactionColumns = ['date', 'amount', 'name', 'account', 'category.0', 'category.1', 'pending'];
  const defaultReferenceColumns = ['notes', 'work', 'joint'];
  const defaultSpreadsheetProvider = 'sheets';
  const defaultTransactionProvider = 'plaid';

  const transactionColumns = JSON.parse(process.env.TRANSACTION_COLUMNS || null) || defaultTransactionColumns;
  const referenceColumns = JSON.parse(process.env.REFERENCE_COLUMNS || null) || defaultReferenceColumns;
  const categoryOverrides = JSON.parse(process.env.CATEGORY_OVERRIDES || null) || [];
  const spreadsheetProvider = JSON.parse(process.env.SPREADSHEET_PROVIDER || null) || defaultSpreadsheetProvider;
  const transactionProvider = JSON.parse(process.env.TRANSACTION_PROVIDER || null) || defaultTransactionProvider;

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

  let currentMonthTransactions;
  let lastMonthTransactions;

  switch (transactionProvider) {
    case 'plaid':
      [currentMonthTransactions, lastMonthTransactions] = await getTransactions(
        transactionColumns,
        categoryOverrides,
        currentMonthSheetTitle,
      );
      break;

    default:
      break;
  }

  switch (spreadsheetProvider) {
    case 'sheets':
      await updateSheets(
        currentMonthTransactions,
        lastMonthTransactions,
        transactionColumns,
        referenceColumns,
        currentMonthSheetTitle,
        lastMonthSheetTitle,
        firstTransactionColumn,
        lastTransactionColumn,
        firstReferenceColumn,
        lastReferenceColumn,
        numAutomatedColumns,
      );
      break;

    default:
      break;
  }
})();
