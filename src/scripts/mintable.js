;(async () => {
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // IMPORTS
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  await require('../lib/common').getConfigEnv()
  const { parse, differenceInMonths, subMonths, startOfMonth, addMonths, format } = require('date-fns')
  const _ = require('lodash')

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // FETCH TRANSACTIONS
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const DATE_FORMAT_FULL = 'YYYY.MM.DD'
  const DATE_FORMAT_MONTHS = 'YYYY.MM'

  // Start date to fetch transactions, or by default the beginning of last month
  let startDate = process.env.START_DATE
    ? startOfMonth(parse(process.env.START_DATE))
    : startOfMonth(subMonths(new Date(), 1))

  // Max historical fetch is 24 months back
  startDate = differenceInMonths(startDate, new Date()) >= 24 ? subMonths(new Date(), 24) : startDate

  // End date to fetch transactions in YYYY-MM-DD format, default to current date
  let endDate = process.env.END_DATE ? parse(process.env.END_DATE) : new Date()

  let transactions

  /*
   * Transactions API:
   *
   * Account providers should provide an exported function which takes in a startDate and endDate,
   * and returns a raw list of transaction objects.
   *
   * At minimum, we expect `name`, `date`, and `amount` to be defined.
   *
   * For example, the following would an acceptable response:
   *
   *     [
   *         { "name": "Amazon.com", "date": "2019-04-16T07:00:00.000Z", "amount": -40.22 },
   *         { "name": "United Airlines", "date": "2019-04-06T07:00:00.000Z", "amount": -500 },
   *         { "name": "Uber", "date": "2019-04-04T07:00:00.000Z", "amount": -6.33 }
   *     ]
   */
  switch (process.env.ACCOUNT_PROVIDER) {
    case 'plaid':
      transactions = await require('../lib/plaid').fetchAllCleanTransactions(startDate, endDate)
      break
    default:
      break
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // MANIPULATE TRANSACTIONS
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  transactions = _.sortBy(transactions, 'date')

  /*
   * Explode out properties of transaction objects based on TRANSACTION_COLUMNS.
   *
   * This allows us to have a string-based TRANSACTION_COLUMNS config property
   * while still supporting disparate providers.
   *
   * We use lodash.get (https://lodash.com/docs/4.17.11#get) to accomplish this.
   *
   * For example, imagine a transaction provider provides
   * a category hierarchy for each transaction, which comes as a list:
   *
   *    {
   *        "name": "Amazon.com",
   *        "date": "2019.04.16",
   *        "amount": -40.22,
   *        "category": ["Shopping", "Online Retailers"]
   *    }
   *
   * If we set TRANSACTION_COLUMNS set to ["name", "date", "amount", "category.0"], this would get returned as
   *
   *    {
   *        "name": "Amazon.com",
   *        "date": "2019.04.16",
   *        "amount": -40.22,
   *        "category.0": "Shopping"
   *    }
   */
  const cleanedTransactions = _.map(transactions, transaction =>
    _.transform(process.env.TRANSACTION_COLUMNS, (acc, column) => (acc[column] = _.get(transaction, column)), {})
  )

  // Calculate the number of sheets based on interval
  let numberSheets = differenceInMonths(endDate, startDate)

  // First sheet should be the start of that time period
  let sheets = []
  let current = startOfMonth(endDate)

  // Build an array of sheet names
  for (i = 0; i <= numberSheets; i++) {
    sheets.push(current)
    current = subMonths(current, 1)
  }
  
  let partitionedTransactions = _.groupBy(cleanedTransactions, transaction => {
    return format(startOfMonth(transaction.date), DATE_FORMAT_MONTHS)
  })

  partitionedTransactions = _.mapKeys(partitionedTransactions, (value, key) => {
    return format(parse(key), DATE_FORMAT_MONTHS)
  })

  partitionedTransactions = _.mapValues(partitionedTransactions, transactions =>
    _.map(transactions, transaction => ({
      ...transaction,
      date: format(transaction.date, DATE_FORMAT_FULL)
    }))
  )

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // UPDATE SHEETS
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Column headers in spreadsheets are defined by letters A-Z, this list gets us indexes for each letter
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const options = {
    // First automated column Mintable populates from transaction data
    firstTransactionColumn: alphabet[0],

    // Last automated column Mintable populates from transaction data
    lastTransactionColumn: alphabet[process.env.TRANSACTION_COLUMNS.length - 1],

    // First untouched reference column that automatically gets created in new sheets
    firstReferenceColumn: alphabet[process.env.TRANSACTION_COLUMNS.length],

    // Last untouched reference column that automatically gets created in new sheets
    lastReferenceColumn: alphabet[process.env.TRANSACTION_COLUMNS.length + process.env.REFERENCE_COLUMNS.length - 1],

    // (# transaction columns + # reference columns), Mintable will only touch this range of the sheet
    numAutomatedColumns: process.env.TRANSACTION_COLUMNS.length + process.env.REFERENCE_COLUMNS.length
  }

  /*
   * Spreadsheets API:
   *
   * Spreadsheet providers should provide an exported function which takes in
   * a map of sheet name to a list of transactions for that sheet,
   * and do all the necessary operations to update that sheet.
   *
   * For example, the following would an acceptable request:
   *
   *     {
   *         "2019.04": [
   *             { "name": "Amazon.com", "date": "2019.04.16", "amount": -40.22 },
   *             { "name": "United Airlines", "date": "2019.04.26", "amount": -500 }
   *         ],
   *         "2019.05": [
   *             { "name": "Uber", "date": "2019.05.11", "amount": -6.33 }
   *         ]
   *     }
   */
  switch (process.env.SHEET_PROVIDER) {
    case 'sheets':
      await require('../lib/google').updateSheets(partitionedTransactions, options)
      break
    default:
      break
  }
})()
