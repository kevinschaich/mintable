import { PlaidEnvironmentType, PlaidConfig } from '../../types/integrations/plaid'
const _ = require('lodash')
import { updateConfig } from '../../lib/config'
import { IntegrationId } from '../../types/integrations'
const prompts = require('prompts')
;(async () => {
  console.log('\nThis script will walk you through setting up the Plaid integration. Follow these steps:')
  console.log('\n\t1. Visit https://plaid.com')
  console.log("\t2. Click 'Get API Keys'")
  console.log('\t3. Fill out the form and wait a few days')
  console.log('\t4. Once approved, visit https://dashboard.plaid.com/team/keys')
  console.log('\t5. Answer the following questions:\n')

  const credentials = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'What would you like to call this integration?',
      initial: 'Plaid',
      validate: (s: string) =>
        0 < s.length && s.length <= 64 ? true : 'Must be between 0 and 64 characters in length.'
    },
    {
      type: 'select',
      name: 'environment',
      message: 'Which Plaid environment would you like to use?',
      choices: [
        {
          title: 'Sandbox',
          // @ts-ignore
          description: 'Test credentials for development purposes (unlimited)',
          value: PlaidEnvironmentType.Sandbox
        },
        {
          title: 'Development',
          // @ts-ignore
          description: 'Real credentials to financial institutions (limited to 100 Items)',
          value: PlaidEnvironmentType.Development
        }
      ],
      initial: 0
    },
    {
      type: 'password',
      name: 'clientId',
      message: 'Client ID',
      validate: (s: string) => (s.length === 24 ? true : 'Must be 24 characters in length.')
    },
    {
      type: 'password',
      name: 'secret',
      message: "Secret (pick the one corresponding to your 'Environment' choice above)",
      validate: (s: string) => (s.length === 30 ? true : 'Must be 30 characters in length.')
    },
    {
      type: 'password',
      name: 'publicKey',
      message: 'Public Key',
      validate: (s: string) => (s.length === 30 ? true : 'Must be 30 characters in length.')
    }
  ])

  updateConfig(config => {
    let plaidConfig = config.integrations[IntegrationId.Plaid] as PlaidConfig

    config.integrations[IntegrationId.Plaid] = {
      ...plaidConfig,
      name: credentials.name,
      environment: credentials.environment,
      credentials: {
        ...plaidConfig.credentials,
        clientId: credentials.clientId,
        secret: credentials.secret,
        publicKey: credentials.publicKey
      }
    }

    return config
  })

  // server.post('/token', (req, res) => {
  //   switch (process.env.ACCOUNT_PROVIDER) {
  //     case 'plaid':
  //       return require('../lib/plaid')
  //         .saveAccessToken(req.body.public_token, req.body.accountNickname)
  //         .then(res.redirect(`http://${process.env.HOST}:${process.env.PORT}/settings`))
  //         .catch(error => res.json(error))
  //     default:
  //       return res.json({ data: {} })
  //   }
  // })

  // server.post('/update', (req, res) => {
  //   switch (process.env.ACCOUNT_PROVIDER) {
  //     case 'plaid':
  //       return require('../lib/plaid')
  //         .createPublicToken(process.env[`PLAID_TOKEN_${req.body.accountNickname}`], req.body.accountNickname)
  //         .then(token => res.json({ data: token }))
  //         .catch(error => res.json(error))
  //     default:
  //       return res.json({ data: {} })
  //   }
  // })
})()
