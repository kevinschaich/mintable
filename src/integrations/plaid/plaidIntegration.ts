import { parse, format } from 'date-fns'
// const pMapSeries = require('p-map-series')
import plaid from 'plaid'
import * as _ from 'lodash'
import { Config, updateConfig } from '../../lib/config'
import { PlaidConfig, PlaidEnvironmentType } from '../../types/integrations/plaid'
import { IntegrationId } from '../../types/integrations'
import express from 'express'
import bodyParser from 'body-parser'
import { logInfo, logError } from '../../lib/logging'
import http from 'http'
import { AccountConfig } from '../../types/account'

export class PlaidIntegration {
    config: Config
    plaidConfig: PlaidConfig
    environment: string
    client: plaid.Client

    constructor(config: Config) {
        this.config = config
        this.plaidConfig = this.config.integrations[IntegrationId.Plaid] as PlaidConfig

        this.environment =
            this.plaidConfig.environment === PlaidEnvironmentType.Development
                ? plaid.environments.development
                : plaid.environments.sandbox

        this.client = new plaid.Client(
            this.plaidConfig.credentials.clientId,
            this.plaidConfig.credentials.secret,
            this.plaidConfig.credentials.publicKey,
            this.environment,
            {
                version: '2018-05-22'
            }
        )
    }

    public addAccount = (): Promise<{
        message?: string
        error?: any
    }> => {
        return new Promise((resolve, reject) => {
            const client = this.client
            const app = express()
            app.use(bodyParser.json())
            app.use(bodyParser.urlencoded({ extended: true }))
            let server: http.Server

            app.post('/get_access_token', function(req, res) {
                const body = req.body
                if (body.public_token !== undefined) {
                    client.exchangePublicToken(body.public_token, function(error, tokenResponse) {
                        if (error != null) {
                            reject({
                                message: 'Encountered error exchanging Plaid public token.',
                                error
                            })
                        }

                        updateConfig(config => {
                            config.accounts[tokenResponse.item_id] = {
                                id: tokenResponse.item_id,
                                integration: IntegrationId.Plaid,
                                token: tokenResponse.access_token
                            }
                            this.config = config
                            return config
                        })

                        resolve({
                            message: 'Plaid access token saved.'
                        })
                        server.close()
                        return res.json({})
                    })
                } else if (body.exit !== undefined) {
                    reject({ error: 'Plaid authentication cancelled.' })
                    server.close()
                    return res.json({})
                } else {
                    reject({ message: 'Encountered error during authentication.', error: body.error })
                    server.close()
                    return res.json({})
                }
            })

            app.get('/', function(req, res) {
                res.sendFile(__dirname + '/addAccount.html')
            })

            server = require('http').createServer(app)
            server.listen('8000')
        })
    }

    public fetchTransactions = async (account: AccountConfig, startDate: Date, endDate: Date) => {
        const options: plaid.TransactionsRequestOptions = { count: 500, offset: 0 }
        const start = format(startDate, 'yyyy-MM-dd')
        const end = format(endDate, 'yyyy-MM-dd')

        return this.client.getTransactions(account.token, start, end, options)

        // .then(data => ({
        //     account: account.nickname,
        //     transactions: data.transactions.map(transaction => ({
        //         ...transaction,
        //         amount: -transaction.amount,
        //         accountNickname: account.nickname
        //     }))
        // }))
        // return wrapPromise(pMapSeries(accounts, fetchTransactionsForAccount), 'Fetching transactions for accounts')
    }
}

// const fetchBalances = options => {
//   const accounts = getAccountTokens()

//   const fetchBalanceForAccount = account => {
//     return wrapPromise(
//       PLAID_CLIENT.getBalance(account.token)
//         .then(data => {
//           return {
//             ...data,
//             nickname: account.nickname
//           }
//         })
//         .catch(error => {
//           return { nickname: account.nickname, error: JSON.stringify(error, null, 2) }
//         }),
//       `Fetching balance for account ${account.nickname}`,
//       options
//     )
//   }

//   return wrapPromise(pMapSeries(accounts, fetchBalanceForAccount), 'Fetching balances for accounts', options)
// }

// // Exchange token flow - exchange a Link public_token for an API access_token
// const saveAccessToken = (public_token, accountNickname) => {
//   return wrapPromise(
//     PLAID_CLIENT.exchangePublicToken(public_token).then(tokenResponse =>
//       updateConfig({ [`PLAID_TOKEN_${accountNickname.toUpperCase()}`]: tokenResponse.access_token })
//     ),
//     `Saving access token for account ${accountNickname}`
//   )
// }

// // Exchange an expired API access_token for a new Link public_token
// const createPublicToken = (access_token, accountNickname) =>
//   PLAID_CLIENT.createPublicToken(access_token).then(tokenResponse => {
//     return tokenResponse.public_token
//   })

// const fetchAllCleanTransactions = async (startDate, endDate, pageSize = 250, offset = 0) => {
//   let transactions = []
//   let count = pageSize
//   let pageNumber = 0

//   // If we receive a full page of transactions from Plaid, that means there is more data to fetch
//   while (count === pageSize) {
//     const result = await fetchTransactions(startDate, endDate, pageSize, pageNumber * pageSize)
//     const clean = _.flatten(_.map(result, account => account.transactions))

//     transactions = transactions.concat(clean)

//     count = clean.length
//     pageNumber++
//   }

//   // Parse transaction date string into a Date object and clean up Pending column
//   transactions = _.map(transactions, transaction => ({
//     ...transaction,
//     date: parse(transaction.date),
//     pending: transaction.pending === true ? 'y' : ''
//   }))

//   // Handle category overrides defined in config
//   if (process.env.CATEGORY_OVERRIDES) {
//     // Handle corner case where this was set before v1.0.0 & scripts/migrate.js double escapes it
//     categoryOverrides =
//       typeof process.env.CATEGORY_OVERRIDES === 'string'
//         ? JSON.parse(process.env.CATEGORY_OVERRIDES)
//         : process.env.CATEGORY_OVERRIDES

//     transactions = _.map(transactions, transaction => {
//       _.forEach(categoryOverrides, override => {
//         if (new RegExp(override.pattern, _.get(override, 'flags', '')).test(transaction.name)) {
//           transaction['category.0'] = _.get(override, 'category.0', '')
//           transaction['category.1'] = _.get(override, 'category.1', '')
//         }
//       })
//       return transaction
//     })
//   }

//   // Fetch accounts & names
//   const accounts = _.keyBy(_.flatten(_.map(await fetchBalances(), item => item.accounts)), 'account_id')

//   // Join in account details to transactions
//   transactions = _.map(transactions, transaction => {
//     const account = accounts[transaction.account_id]
//     return {
//       ..._.omit(transaction, ['accountNickname']),
//       account_details: {
//         ...account,
//         official_name: account.official_name,
//         name: account.name,
//         nickname: transaction.accountNickname
//       },
//       account: account.official_name || account.name || transaction.accountNickname
//     }
//   })

//   return transactions
// }
