const plaid = require('plaid');

module.exports = (client, secret, public_key) => new plaid.Client(
  client,
  secret,
  public_key,
  plaid.environments.development,
  {
    version: '2018-05-22'
  }
);
