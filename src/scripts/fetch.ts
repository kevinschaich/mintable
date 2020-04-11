import { getConfig } from '../lib/config'
import { PlaidIntegration } from '../integrations/plaid/plaidIntegration'
import { logInfo, logError } from '../lib/logging'
import { AccountConfig } from '../types/account'
import { IntegrationId } from '../types/integrations'
const { parse, differenceInMonths, subMonths, startOfMonth, addMonths, format } = require('date-fns')

    // Declare async block after imports complete
;(async () => {
    const config = getConfig()
    const plaid = new PlaidIntegration(config)

    interface AccountWithTransactions extends AccountConfig {
        transactions?: any
    }
    let accounts: { [id: string]: AccountWithTransactions } = config.accounts

    // Start date to fetch transactions, default to 2 months of history
    let startDate = process.env.START_DATE ? parse(process.env.START_DATE) : startOfMonth(subMonths(new Date(), 2))

    // End date to fetch transactions in YYYY-MM-DD format, default to current date
    let endDate = process.env.END_DATE ? parse(process.env.END_DATE) : new Date()

    for (let [id, account] of Object.entries(accounts)) {
        logInfo(`Fetching transactions for account ${id}`)

        let transactions

        if (accounts[id].integration === IntegrationId.Plaid) {
            transactions = await plaid.fetchTransactions(accounts[id], startDate, endDate)
        }

        accounts[id] = { ...accounts[id], transactions: transactions }
    }

    logInfo('accounts', accounts)
    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //   // IMPORTS
    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //   await require('../lib/common').maybeWriteDefaultConfig()
    //   await require('../lib/common').getConfigEnv()
    //   const { parse, differenceInMonths, subMonths, startOfMonth, addMonths, format } = require('date-fns')
    //   const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //   // FETCH BALANCES
    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //   if (process.env.CREATE_BALANCES_SHEET) {
    //     let balances

    //     switch (process.env.ACCOUNT_PROVIDER) {
    //       case 'plaid':
    //         balances = _.keyBy(
    //           _.flatten(_.map(await require('../lib/plaid').fetchBalances(), item => item.accounts)),
    //           'account_id'
    //         )
    //         break
    //       default:
    //         break
    //     }

    //     switch (process.env.SHEET_PROVIDER) {
    //       case 'sheets':
    //         let balanceSheet = _.find(
    //           await require('../lib/google').getSheets(process.env.SHEETS_SHEET_ID),
    //           sheet => sheet.properties.title === 'Balances'
    //         )
    //         if (!balanceSheet) {
    //           await require('../lib/google').addSheet('Balances')
    //           balanceSheet = _.find(
    //             await require('../lib/google').getSheets(process.env.SHEETS_SHEET_ID),
    //             sheet => sheet.properties.title === 'Balances'
    //           )
    //         }

    //         const cleanedBalances = _.map(_.values(balances), account => {
    //           if (account.error) {
    //             return _.zipObject(process.env.BALANCE_COLUMNS, Array(process.env.BALANCE_COLUMNS.length).fill("Error"))
    //           }
    //           else {
    //             return _.at(account, process.env.BALANCE_COLUMNS)
    //           }
    //         })

    //         await require('../lib/google').updateRanges({
    //           range: `Balances!A1:${alphabet[process.env.BALANCE_COLUMNS.length - 1]}${_.keys(balances).length + 1}`,
    //           values: [process.env.BALANCE_COLUMNS].concat(cleanedBalances)
    //         })

    //         await require('../lib/google').formatSheets(
    //           [balanceSheet.properties.sheetId],
    //           process.env.BALANCE_COLUMNS.length
    //         )
    //         break
    //       default:
    //         break
    //     }
    //   }

    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //   // FETCH TRANSACTIONS
    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //   const DATE_FORMAT_FULL = 'YYYY.MM.DD'
    //   const DATE_FORMAT_MONTHS = 'YYYY.MM'

    //   // Start date to fetch transactions, or by default the beginning of last month
    //   let startDate = process.env.START_DATE ? parse(process.env.START_DATE) : startOfMonth(subMonths(new Date(), 1))

    //   // Max historical fetch is 24 months back
    //   startDate = differenceInMonths(startDate, new Date()) >= 24 ? subMonths(new Date(), 24) : startDate

    //   // End date to fetch transactions in YYYY-MM-DD format, default to current date
    //   let endDate = process.env.END_DATE ? parse(process.env.END_DATE) : new Date()

    //   let transactions

    //   // https://github.com/kevinschaich/mintable/blob/master/docs/PROVIDERS.md
    //   switch (process.env.ACCOUNT_PROVIDER) {
    //     case 'plaid':
    //       transactions = await require('../lib/plaid').fetchAllCleanTransactions(startDate, endDate)
    //       break
    //     default:
    //       break
    //   }

    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //   // MANIPULATE TRANSACTIONS
    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //   transactions = _.sortBy(transactions, 'date')

    //   /*
    //    * Explode out properties of transaction objects based on TRANSACTION_COLUMNS.
    //    *
    //    * This allows us to have a string-based TRANSACTION_COLUMNS config property
    //    * while still supporting disparate providers.
    //    *
    //    * We use lodash.get (https://lodash.com/docs/4.17.11#get) to accomplish this.
    //    *
    //    * For example, imagine a transaction provider provides
    //    * a category hierarchy for each transaction, which comes as a list:
    //    *
    //    *    {
    //    *        "name": "Amazon.com",
    //    *        "date": "2019.04.16",
    //    *        "amount": -40.22,
    //    *        "category": ["Shopping", "Online Retailers"]
    //    *    }
    //    *
    //    * If we set TRANSACTION_COLUMNS set to ["name", "date", "amount", "category.0"], this would get returned as
    //    *
    //    *    {
    //    *        "name": "Amazon.com",
    //    *        "date": "2019.04.16",
    //    *        "amount": -40.22,
    //    *        "category.0": "Shopping"
    //    *    }
    //    */
    //   const cleanedTransactions = _.map(transactions, transaction =>
    //     _.transform(process.env.TRANSACTION_COLUMNS, (acc, column) => (acc[column] = _.get(transaction, column)), {})
    //   )

    //   // Calculate the number of sheets based on interval
    //   let numberSheets = differenceInMonths(endDate, startDate)

    //   // First sheet should be the start of that time period
    //   let sheets = []
    //   let current = startOfMonth(endDate)

    //   // Build an array of sheet names
    //   for (i = 0; i <= numberSheets; i++) {
    //     sheets.push(current)
    //     current = subMonths(current, 1)
    //   }

    //   let partitionedTransactions = _.groupBy(cleanedTransactions, transaction => {
    //     return format(startOfMonth(transaction.date), DATE_FORMAT_MONTHS)
    //   })

    //   partitionedTransactions = _.mapKeys(partitionedTransactions, (value, key) => {
    //     return format(parse(key), DATE_FORMAT_MONTHS)
    //   })

    //   partitionedTransactions = _.mapValues(partitionedTransactions, transactions =>
    //     _.map(transactions, transaction => ({
    //       ...transaction,
    //       date: format(transaction.date, DATE_FORMAT_FULL)
    //     }))
    //   )

    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //   // UPDATE SHEETS
    //   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //   // Column headers in spreadsheets are defined by letters A-Z, this list gets us indexes for each letter
    //   const options = {
    //     // First automated column Mintable populates from transaction data
    //     firstTransactionColumn: alphabet[0],

    //     // Last automated column Mintable populates from transaction data
    //     lastTransactionColumn: alphabet[process.env.TRANSACTION_COLUMNS.length - 1],

    //     // First untouched reference column that automatically gets created in new sheets
    //     firstReferenceColumn: alphabet[process.env.TRANSACTION_COLUMNS.length],

    //     // Last untouched reference column that automatically gets created in new sheets
    //     lastReferenceColumn: alphabet[process.env.TRANSACTION_COLUMNS.length + process.env.REFERENCE_COLUMNS.length - 1],

    //     // (# transaction columns + # reference columns), Mintable will only touch this range of the sheet
    //     numAutomatedColumns: process.env.TRANSACTION_COLUMNS.length + process.env.REFERENCE_COLUMNS.length
    //   }

    //   // https://github.com/kevinschaich/mintable/blob/master/docs/PROVIDERS.md
    //   switch (process.env.SHEET_PROVIDER) {
    //     case 'sheets':
    //       await require('../lib/google').updateSheets(partitionedTransactions, options)
    //       break
    //     default:
    //       break
    //   }
    // })().catch((e) => {
    //   console.error(e);
    //   process.exit(1);
})()
