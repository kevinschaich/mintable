import path from 'path'
import { compareAsc, parseISO, subMonths } from 'date-fns'
import { Config, updateConfig } from '../../common/config'
import { TellerConfig, TellerTransaction } from '../../types/integrations/teller'
import { IntegrationId } from '../../types/integrations'
import express from 'express'
import bodyParser from 'body-parser'
import { logInfo, logError, logWarn } from '../../common/logging'
import http from 'http'
import https from 'https'
import { AccountConfig, Account, TellerAccountConfig } from '../../types/account'
import { Transaction } from '../../types/transaction'
import { readFileSync } from 'fs'

export class TellerIntegration {
    config: Config
    tellerConfig: TellerConfig

    constructor(config: Config) {
        this.config = config
        this.tellerConfig = this.config.integrations[IntegrationId.Teller] as TellerConfig
    }

    public tellerApi = (token: string, path: string, method = 'GET', body?: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            const req = https.request(`https://api.teller.io/${path}`, {
                method,
                auth: `${token}:`,
                cert: readFileSync(this.tellerConfig.pathCertificate),
                key: readFileSync(this.tellerConfig.pathPrivateKey),
            }, (res) => {
                const resData = []
                res.on('data', (chunk) => resData.push(chunk))
                res.on('end', () => {
                    const resString = Buffer.concat(resData).toString()
                    resolve(JSON.parse(resString))
                })
            })
            req.on('error', (e) => {
                logError(`tellerApi encountered https request error: ${e.message}`, e)
                reject(e)
            })
            if (body) {
                req.write(body)
            }
            req.end()
        })
    }

    public registerAccount = (accessToken: string, accountId: string): void => {
        updateConfig(config => {
            config.accounts[accountId] = {
                id: accountId,
                integration: IntegrationId.Teller,
                token: accessToken
            }
            this.config = config
            return config
        })
    }

    public accountSetup = (): Promise<void> => {
        return new Promise((resolve) => {
            const app = express()
                .use(bodyParser.json())
                .use(bodyParser.urlencoded({ extended: true }))
                .use(express.static(path.resolve(path.join(__dirname, '../../../docs'))))

            let server: http.Server

            app.post('/get_enrollment_accounts', async (req, res) => {
                if (!req.body.enrollment || !req.body.enrollment.accessToken) {
                    logError('Received invalid request body for /get_enrollment_accounts', req.body)
                    res.status(401)
                    return res.json({})
                }

                const accounts = await this.tellerApi(req.body.enrollment.accessToken, 'accounts')
                return res.json(accounts)
            })

            app.post('/register_account', (req, res) => {
                if (!req.body.accessToken || !req.body.accountId) {
                    logError('Received invalid request body for /register_account', req.body)
                    res.status(401)
                    return res.json({})
                }
                this.registerAccount(req.body.accessToken, req.body.accountId)
                resolve(logInfo('Teller access token saved for account.', req.body))
                return res.json({})
            })

            app.post('/accounts', async (req, res) => {
                const accounts: { id: string; name: string; token: string }[] = []

                for (const accountId in this.config.accounts) {
                    const accountConfig: TellerAccountConfig = this.config.accounts[accountId] as TellerAccountConfig
                    if (accountConfig.integration === IntegrationId.Teller) {
                        const accountInfo = await this.tellerApi(accountConfig.token, `accounts/${accountConfig.id}`)
                        accounts.push({
                            id: accountConfig.id,
                            name: accountInfo ? `${accountInfo.institution?.name} ${accountInfo.name} ${accountInfo.last_four}` : '-',
                            token: accountConfig.token
                        })
                    }
                }
                return res.json(accounts)
            })

            app.post('/remove', (req, res) => {
                try {
                    updateConfig(config => {
                        if (config.accounts[req.body.accountId]) {
                            delete config.accounts[req.body.accountId]
                        }
                        this.config = config
                        return config
                    })
                    logInfo('Successfully removed Teller account.', req.body.accountId)
                    return res.json({})
                } catch (error) {
                    logError('Error removing Teller account.', error)
                }
            })

            app.post('/done', (req, res) => {
                res.json({})
                server.close()
                return resolve()
            })

            app.get('/', (req, res) =>
                res.sendFile(path.resolve(path.join(__dirname, '../../../src/integrations/teller/account-setup.html')))
            )

            server = http
                .createServer(app)
                .listen('8000')
        })
    }

    public fetchPagedTransactions = (
        accountConfig: AccountConfig,
        startDate: Date,
        endDate: Date
    ): Promise<TellerTransaction[]> => {
        return new Promise((resolve, reject) => {
            accountConfig = accountConfig as TellerAccountConfig
            try {
                return this.tellerApi(accountConfig.token, `accounts/${accountConfig.id}/transactions`)
                  .then((ttxs: TellerTransaction[]) => {
                    if (!ttxs.reduce) {
                        logError('Received unexpected data from Teller transactions API', ttxs)
                        throw new Error('Received unexpected data from Teller transactions API')
                    }
                    const filteredTtxs: TellerTransaction[] = ttxs.reduce((results, ttx) => {
                        const ttxDate = parseISO(ttx.date)
                        if (compareAsc(ttxDate, startDate) !== -1 && compareAsc(ttxDate, endDate) !== 1) {
                            results.push(ttx)
                        }
                        return results
                    }, [])
                    logInfo(`Received ${ttxs.length} transactions. Will import ${filteredTtxs.length} transactions within date range.`)
                    return resolve(filteredTtxs)
                  })
            } catch (e) {
                logError(`fetchPagedTransactions encountered error: ${e.message}`, e)
                return reject(e)
            }
        })
    }

    public fetchAccount = async (accountConfig: AccountConfig, startDate: Date, endDate: Date): Promise<Account[]> => {
        accountConfig = accountConfig as TellerAccountConfig
        if (startDate < subMonths(new Date(), 5)) {
            logWarn('Transaction history older than 6 months may not be available for some institutions.', {})
        }

        const account: Account = {
            integration: IntegrationId.Teller,
            accountId: accountConfig.id,
            account: accountConfig.id
        }

        const accountInfo = await this.tellerApi(accountConfig.token, `accounts/${accountConfig.id}`)

        if (accountInfo.error) {
            logWarn('Could not fetch data for account from Teller. Authentication may be expired. Run: `mintable teller-account-setup`', {})
            throw new Error('Could not fetch data for account from Teller.')
        }

        if (accountInfo) {
            account.institution = accountInfo.institution?.name
            account.account = accountInfo.name
            account.mask = accountInfo.last_four
            account.type = accountInfo.subtype || accountInfo.type
            account.currency = accountInfo.currency
        }
        const isCredit = accountInfo && accountInfo.type === 'credit'

        const accountBalance = await this.tellerApi(accountConfig.token, `accounts/${accountConfig.id}/balances`)

        if (accountBalance) {
            account.current = accountBalance.ledger
            account.available = accountBalance.available
            account.limit = accountBalance.ledger + accountBalance.available
        }

        const data = await this.fetchPagedTransactions(accountConfig, startDate, endDate)

        if (!data || !data.map) {
            logWarn(`fetchAccount received unexpected response for transactions from ${account.institution} ${account.account}`, data)
            return []
        }

        // With Teller, the amount value can be positive for both a purchase
        // made with a credit card and a deposit made into a checking account.
        // However in terms of a budget, a purchase should be a positive value
        // and a deposit should have a negative value, so we normalize it here.
        const transactions: Transaction[] = data.map(tt => ({
            integration: IntegrationId.Teller,
            name: tt.description,
            date: parseISO(tt.date),
            amount: !isCredit ? -1 * Number(tt.amount) : Number(tt.amount),
            currency: account.currency,
            type: tt.type,
            institution: account.institution,
            account: `${account.institution} ${account.account} ${account.mask}`,
            accountId: tt.account_id,
            transactionId: tt.id,
            category: tt.details?.category,
            pending: tt.status === 'pending'
        }))

        account.transactions = transactions

        logInfo(
            `Fetched account with ${transactions.length} transactions.`,
            account
        )
        return [account]
    }
}
