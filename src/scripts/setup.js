const express = require('express')
const next = require('next')
const bodyParser = require('body-parser')
const opn = require('opn')
const {
  getConfigEnv,
  updateConfig,
  deleteConfigProperty,
  maybeWriteDefaultConfig,
  accountsSetupCompleted,
  sheetsSetupCompleted
} = require('../lib/common')
const { logPromise } = require('../lib/logging')
const _ = require('lodash')

try {
  const port = parseInt(process.env.PORT, 10) || 3000
  const dev = process.env.NODE_ENV !== 'production'
  const app = next({ dev })
  const handle = app.getRequestHandler()

  app.prepare().then(() => {
    maybeWriteDefaultConfig()

    const server = express()
    server.use(bodyParser.urlencoded({ extended: false }))
    server.use(bodyParser.json())

    server.get('/config', async (req, res) => {
      const config = await logPromise(getConfigEnv(), 'Serving current config')
      return res.json({
        ...config,
        accountsSetupCompleted: accountsSetupCompleted(),
        sheetsSetupCompleted: sheetsSetupCompleted()
      })
    })

    server.put('/config', async (req, res) => {
      return updateConfig({ [req.body.id]: req.body.value })
    })

    server.delete('/config', async (req, res) => {
      return deleteConfigProperty(req.body.id)
    })

    server.get('/balances', async (req, res, next) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          return res.json(await require('../lib/plaid/plaid').fetchBalances())
        default:
          return {}
      }
    })

    server.post('/token', async (req, res, next) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          return await require('../lib/plaid/plaid').saveAccessToken(req.body.public_token, req.body.accountNickname)
        default:
          return
      }
    })

    server.post('/update', async (req, res, next) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          return res.json({
            public_token: await require('../lib/plaid/plaid').createPublicToken(
              process.env[`PLAID_TOKEN_${nickname}`],
              req.body.accountNickname
            )
          })
        default:
          return
      }
    })

    server.get('/google-sheets-url', async (req, res) => {
      return res.json({ url: require('../lib/google/sheets').getAuthURL() })
    })

    server.get('/google-sheets-oauth2callback', async (req, res) => {
      await require('../lib/google/sheets').getToken(req.query.code)
      return res.redirect('http://localhost:3000/sheets')
    })

    server.get('/', (req, res) => {
      const page = accountsSetupCompleted() && sheetsSetupCompleted() ? 'settings' : 'welcome'
      return res.redirect(`http://localhost:3000/${page}`)
    })

    server.get('*', (req, res) => {
      return handle(req, res)
    })

    server.listen(port, error => {
      if (error) throw error
      console.log(`> Ready on http://localhost:${port}`)
      opn(`http://localhost:${port}`)
    })
  })
} catch (error) {
  console.log(error)
}
