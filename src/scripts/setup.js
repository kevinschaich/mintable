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

    server.get('/config', (req, res) => {
      return getConfigEnv()
        .then(config =>
          res.json({
            data: {
              ...config,
              accountsSetupCompleted: accountsSetupCompleted(),
              sheetsSetupCompleted: sheetsSetupCompleted()
            }
          })
        )
        .catch(error => res.json(error))
    })

    server.put('/config', (req, res) => {
      return updateConfig(req.body.updates)
        .then(response => res.json({ data: {} }))
        .catch(error => res.json(error))
    })

    server.delete('/config', (req, res) => {
      return deleteConfigProperty(req.body.id)
        .then(response => res.json({ data: {} }))
        .catch(error => res.json(error))
    })

    server.get('/balances', (req, res) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          return require('../lib/plaid')
            .fetchBalances()
            .then(balances => res.json({ data: balances }))
            .catch(error => res.json(error))
        default:
          return res.json({ data: {} })
      }
    })

    server.post('/token', (req, res) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          return require('../lib/plaid')
            .saveAccessToken(req.body.public_token, req.body.accountNickname)
            .then(balances => res.json({ data: balances }))
            .catch(error => res.json(error))
        default:
          return res.json({ data: {} })
      }
    })

    server.post('/update', (req, res) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          return require('../lib/plaid')
            .createPublicToken(process.env[`PLAID_TOKEN_${nickname}`], req.body.accountNickname)
            .then(token => res.json({ data: token }))
            .catch(error => res.json(error))
        default:
          return res.json({ data: {} })
      }
    })

    server.get('/google-sheets-url', (req, res) => {
      return require('../lib/google/sheets')
        .getAuthURL()
        .then(url => res.json({ data: url }))
        .catch(error => res.json(error))
    })

    server.get('/google-sheets-oauth2callback', (req, res) => {
      return require('../lib/google/sheets')
        .getToken(req.query.code)
        .then(token => res.redirect('http://localhost:3000/sheets'))
        .catch(error => res.json(error))
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
