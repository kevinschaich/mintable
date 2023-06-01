import path from 'path'
import { parseISO, format, subMonths } from 'date-fns'
import plaid, { TransactionsResponse, CreateLinkTokenOptions } from 'plaid'
import { Config, updateConfig } from '../../common/config'
import { PlaidConfig, PlaidEnvironmentType } from '../../types/integrations/plaid'
import { IntegrationId } from '../../types/integrations'
import express from 'express'
import bodyParser from 'body-parser'
import { logInfo, logError, logWarn } from '../../common/logging'
import http from 'http'
import { AccountConfig, Account, PlaidAccountConfig } from '../../types/account'
import { Transaction } from '../../types/transaction'

const PLAID_USER_ID = 'LOCAL'

export class PlaidIntegration {
    config: Config
    plaidConfig: PlaidConfig
    environment: string
    client: plaid.Client
    user: plaid.User

    constructor(config: Config) {
        this.config = config
        this.plaidConfig = this.config.integrations[IntegrationId.Plaid] as PlaidConfig

        this.environment =
            this.plaidConfig.environment === PlaidEnvironmentType.Development
                ? plaid.environments.development
                : plaid.environments.sandbox

        this.client = new plaid.Client({
            clientID: this.plaidConfig.credentials.clientId,
            secret: this.plaidConfig.credentials.secret,
            env: this.environment,
            options: {
                version: '2019-05-29'
            }
        })

        // In production this is supposed to be a unique identifier but for Mintable we only have one user (you)
        this.user = {
            client_user_id: PLAID_USER_ID
        }
    }

    public exchangeAccessToken = (accessToken: string): Promise<string> =>
        // Exchange an expired API access_token for a new Link public_token
        this.client.createPublicToken(accessToken).then(token => token.public_token)

    public savePublicToken = (tokenResponse: plaid.TokenResponse): void => {
        updateConfig(config => {
            config.accounts[tokenResponse.item_id] = {
                id: tokenResponse.item_id,
                integration: IntegrationId.Plaid,
                token: tokenResponse.access_token
            }
            this.config = config
            return config
        })
    }

    public accountSetup = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            const client = this.client
            const app = express()
                .use(bodyParser.json())
                .use(bodyParser.urlencoded({ extended: true }))
                .use(express.static(path.resolve(path.join(__dirname, '../../../docs'))))

            let server: http.Server

            app.post('/get_access_token', (req, res) => {
                if (req.body.public_token !== undefined) {
                    client.exchangePublicToken(req.body.public_token, (error, tokenResponse) => {
                        if (error != null) {
                            reject(logError('Encountered error exchanging Plaid public token.', error))
                        }
                        this.savePublicToken(tokenResponse)
                        resolve(logInfo('Plaid access token saved.', req.body))
                    })
                } else if (req.body.exit !== undefined) {
                    resolve(logInfo('Plaid authentication exited.', req.body))
                } else {
                    if ((req.body.error['error-code'] = 'item-no-error')) {
                        resolve(logInfo('Account is OK, no further action is required.', req.body))
                    } else {
                        reject(logError('Encountered error during authentication.', req.body))
                    }
                }
                return res.json({})
            })

            app.post('/accounts', async (req, res) => {
                let accounts: { name: string; token: string }[] = []

                for (const accountId in this.config.accounts) {
                    const accountConfig: PlaidAccountConfig = this.config.accounts[accountId] as PlaidAccountConfig
                    if (accountConfig.integration === IntegrationId.Plaid) {
                        try {
                            await this.client.getAccounts(accountConfig.token).then(resp => {
                                accounts.push({
                                    name: resp.accounts[0].name,
                                    token: accountConfig.token
                                })
                            })
                        } catch {
                            accounts.push({
                                name: 'Error fetching account name',
                                token: accountConfig.token
                            })
                        }
                    }
                }
                return res.json(accounts)
            })

            app.post('/create_link_token', async (req, res) => {
                const clientUserId = this.user.client_user_id
                const country_codes = process.env.COUNTRY_CODES ? process.env.COUNTRY_CODES.split(',') : ['US']
                const language = process.env.LANGUAGE ? process.env.LANGUAGE : 'en'
                const options: CreateLinkTokenOptions = {
                    user: {
                        client_user_id: clientUserId
                    },
                    client_name: 'Mintable',
                    products: ['transactions'],
                    country_codes,
                    language
                }
                if (req.body.access_token) {
                    options.access_token = req.body.access_token
                    delete options.products
                }
                this.client.createLinkToken(options, (err, data) => {
                    if (err) {
                        logError('Error creating Plaid link token.', err)
                    }
                    logInfo('Successfully created Plaid link token.')
                    res.json({ link_token: data.link_token })
                })
            })

            app.post('/remove', async (req, res) => {
                try {
                    await updateConfig(config => {
                        Object.values(config.accounts).forEach(account => {
                            const accountConfig: PlaidAccountConfig = account as PlaidAccountConfig

                            if (accountConfig.hasOwnProperty('token') && accountConfig.token == req.body.token) {
                                delete config.accounts[accountConfig.id]
                            }
                        })
                        this.config = config
                        return config
                    })
                    logInfo('Successfully removed Plaid account.', req.body.token)
                    return res.json({})
                } catch (error) {
                    logError('Error removing Plaid account.', error)
                }
            })

            app.post('/done', (req, res) => {
                res.json({})
                return server.close()
            })

            app.get('/', (req, res) =>
                res.sendFile(path.resolve(path.join(__dirname, '../../../src/integrations/plaid/account-setup.html')))
            )

            server = require('http')
                .createServer(app)
                .listen('8000')
        })
    }

    public fetchPagedTransactions = async (
        accountConfig: AccountConfig,
        startDate: Date,
        endDate: Date
    ): Promise<TransactionsResponse> => {
        return new Promise(async (resolve, reject) => {
            accountConfig = accountConfig as PlaidAccountConfig
            try {
                const dateFormat = 'yyyy-MM-dd'
                const start = format(startDate, dateFormat)
                const end = format(endDate, dateFormat)

                let options: plaid.TransactionsRequestOptions = { count: 500, offset: 0 }
                let accounts = await this.client.getTransactions(accountConfig.token, start, end, options)

                while (accounts.transactions.length < accounts.total_transactions) {
                    options.offset += options.count
                    const next_page = await this.client.getTransactions(accountConfig.token, start, end, options)
                    accounts.transactions = accounts.transactions.concat(next_page.transactions)
                }

                return resolve(accounts)
            } catch (e) {
                return reject(e)
            }
        })
    }

    public fetchAccount = async (accountConfig: AccountConfig, startDate: Date, endDate: Date): Promise<Account[]> => {
        if (startDate < subMonths(new Date(), 5)) {
            logWarn('Transaction history older than 6 months may not be available for some institutions.', {})
        }

        return this.fetchPagedTransactions(accountConfig, startDate, endDate)
            .then(data => {
                let accounts: Account[] = data.accounts.map(account => ({
                    integration: IntegrationId.Plaid,
                    accountId: account.account_id,
                    mask: account.mask,
                    institution: account.name,
                    account: account.official_name,
                    type: account.subtype || account.type,
                    current: account.balances.current,
                    available: account.balances.available,
                    limit: account.balances.limit,
                    currency: account.balances.iso_currency_code || account.balances.unofficial_currency_code
                }))

                const transactions: Transaction[] = data.transactions.map(transaction => ({
                    integration: IntegrationId.Plaid,
                    name: transaction.name,
                    date: parseISO(transaction.date),
                    amount: transaction.amount,
                    currency: transaction.iso_currency_code || transaction.unofficial_currency_code,
                    type: transaction.transaction_type,
                    accountId: transaction.account_id,
                    transactionId: transaction.transaction_id,
                    pendingtransactionId: transaction.pending_transaction_id,
                    category: transaction.category.join(' - '),
                    address: transaction.location.address,
                    city: transaction.location.city,
                    state: transaction.location.region,
                    postal_code: transaction.location.postal_code,
                    country: transaction.location.country,
                    latitude: transaction.location.lat,
                    longitude: transaction.location.lon,
                    pending: transaction.pending
                }))

                accounts = accounts.map(account => ({
                    ...account,
                    transactions: transactions
                        .filter(transaction => transaction.accountId === account.accountId)
                        .map(transaction => ({
                            ...transaction,
                            institution: account.institution,
                            account: account.account
                        }))
                }))

                logInfo(
                    `Fetched ${data.accounts.length} sub-accounts and ${data.total_transactions} transactions.`,
                    accounts
                )
                return accounts
            })
            .catch(error => {
                logError(`Error fetching account ${accountConfig.id}.`, error)
                return []
            })
    }
}
