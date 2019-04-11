const express = require('express')
const next = require('next')
const bodyParser = require('body-parser')
const opn = require('opn')
const {
  getConfigEnv,
  writeConfigProperty,
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
      const config = await logPromise(getConfigEnv(), 'Getting current config')
      res.json({
        ...config,
        accountsSetupCompleted: accountsSetupCompleted(),
        sheetsSetupCompleted: sheetsSetupCompleted()
      })
    })

    server.put('/config', async (req, res) => {
      const writeStatus = writeConfigProperty(req.body.id, req.body.value)
      if (writeStatus === false) {
        res.status(400).send('Error: Could not write config file.')
      } else {
        res.status(201).send('Successfully wrote config file.')
      }
    })

    server.delete('/config', async (req, res) => {
      const writeStatus = deleteConfigProperty(req.body.id)
      if (writeStatus === false) {
        res.status(400).send('Error: Could not write config file.')
      } else {
        res.status(201).send('Successfully wrote config file.')
      }
    })

    server.get('/balances', async (req, res, next) => {
      let balances

      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          const plaid = require('../lib/plaid/plaid')
          balances = await plaid.fetchBalances({ quiet: true })
          break
        default:
          break
      }

      res.json(balances || {})
    })

    server.post('/token', async (req, res, next) => {
      try {
        switch (process.env.ACCOUNT_PROVIDER) {
          case 'plaid':
            const plaid = require('../lib/plaid/plaid')
            resp = await plaid.saveAccessToken(req.body.public_token, req.body.accountNickname, { quiet: true })
            error = await resp[0]
            break
          default:
            break
        }

        if (error != false) {
          res.status(400).send('Error: Could not get access token.' + JSON.stringify(error))
        } else {
          res.status(201).send('Saved access token.')
        }
      } catch (error) {
        res.status(400).send('Error: Could not get access token.' + JSON.stringify(error))
      }
    })

    server.post('/update', async (req, res, next) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          const plaid = require('../lib/plaid/plaid')
          const nickname = req.body.accountNickname
          const access_token = process.env[`PLAID_TOKEN_${nickname}`]
          const public_token = await plaid.createPublicToken(access_token, nickname, { quiet: true })
          return res.json({ public_token })
        default:
          break
      }
    })

    server.get('/google-sheets-url', (req, res) => {
      const oAuth2Client = require('../lib/google/googleClient')

      res.json({
        url: oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/spreadsheets']
        })
      })
    })

    server.get('/google-sheets-oauth2callback', (req, res) => {
      const oAuth2Client = require('../lib/google/googleClient')

      const code = req.query.code
      oAuth2Client.getToken(code, (error, token) => {
        if (error) {
          res.status(400).send('Error while trying to retrieve access token' + JSON.stringify(error))
        } else {
          Object.keys(token).forEach(key => {
            writeConfigProperty(`SHEETS_${key.toUpperCase()}`, token[key])
          })
          console.log(`Token stored in .env.`)
          return res.redirect('http://localhost:3000/sheets')
        }
      })
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
