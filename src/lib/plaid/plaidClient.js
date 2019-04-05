const { getConfigEnv } = require('../common')

getConfigEnv()

const plaid = require('plaid')

const environment = () => {
  switch (process.env.PLAID_ENVIRONMENT) {
    case 'sandbox':
      return plaid.environments.sandbox
    case 'production':
      return plaid.environments.production
    default:
      return plaid.environments.development
  }
}

module.exports = new plaid.Client(
  process.env.PLAID_CLIENT_ID,
  process.env.PLAID_SECRET,
  process.env.PLAID_PUBLIC_KEY,
  environment(),
  {
    version: '2018-05-22'
  }
)
