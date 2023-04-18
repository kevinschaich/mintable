import path from 'path'
import { parseISO, format, subMonths } from 'date-fns'
import plaid, {
    AccountBase,
    Configuration,
    CountryCode,
    ItemPublicTokenExchangeResponse,
    LinkTokenCreateRequest,
    PlaidApi,
    PlaidEnvironments,
    Products,
    TransactionsGetRequest
} from 'plaid'
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
    client: PlaidApi
    user: any

    constructor(config: Config) {
        this.config = config
        this.plaidConfig = this.config.integrations[IntegrationId.Plaid] as PlaidConfig

        this.environment =
            this.plaidConfig.environment === PlaidEnvironmentType.Development
                ? PlaidEnvironments.development
                : PlaidEnvironments.sandbox

        const configuration = new Configuration({
            basePath: this.environment,
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': this.plaidConfig.credentials.clientId,
                    'PLAID-SECRET': this.plaidConfig.credentials.secret,
                    'Plaid-Version': '2020-09-14',
                }
            }
        })

        this.client = new PlaidApi(configuration)

        // In production this is supposed to be a unique identifier but for Mintable we only have one user (you)
        this.user = {
            client_user_id: PLAID_USER_ID
        }
    }

    public savePublicToken = (tokenResponse: ItemPublicTokenExchangeResponse): void => {
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
                console.log(req.body.public_token)
                if (req.body.public_token !== undefined) {
                    client.itemPublicTokenExchange({ public_token: req.body.public_token }).then(res => {
                        this.savePublicToken(res.data)
                        console.log(res.data)
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
                            await this.client.accountsGet({ access_token: accountConfig.token }).then(resp => {
                                accounts.push({
                                    name: resp.data.accounts[0].name,
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
                const options: LinkTokenCreateRequest = {
                    user: {
                        client_user_id: this.user.client_user_id
                    },
                    client_name: 'Mintable',
                    products: [Products.Transactions],
                    country_codes: [CountryCode.Us], // TODO
                    language: 'en' // TODO
                }

                const result = await this.client.linkTokenCreate(options)

                res.json({ link_token: result.data.link_token })
                console.log(result.data.link_token)
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
    ): Promise<{ accounts: AccountBase[]; transactions: plaid.Transaction[] }> => {
        return new Promise(async (resolve, reject) => {
            accountConfig = accountConfig as PlaidAccountConfig

            const dateFormat = 'yyyy-MM-dd'
            const start = format(startDate, dateFormat)
            const end = format(endDate, dateFormat)

            const request: TransactionsGetRequest = {
                access_token: accountConfig.token,
                start_date: start,
                end_date: end
            }

            try {
                const response = await this.client.transactionsGet(request)

                let transactions = response.data.transactions
                const total_transactions = response.data.total_transactions
                // Manipulate the offset parameter to paginate
                // transactions and retrieve all available data

                while (transactions.length < total_transactions) {
                    const paginatedRequest: TransactionsGetRequest = {
                        ...request,
                        options: {
                            offset: transactions.length
                        }
                    }

                    const paginatedResponse = await this.client.transactionsGet(paginatedRequest)
                    transactions = transactions.concat(paginatedResponse.data.transactions)
                }
                return resolve({ accounts: response.data.accounts, transactions: transactions })
            } catch (e) {
                console.log(e)
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
                    `Fetched ${data.accounts.length} sub-accounts and ${data.transactions.length} transactions.`,
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
