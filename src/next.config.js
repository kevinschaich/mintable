// require('dotenv').config();
const _ = require('lodash');

const withSass = require('@zeit/next-sass')
module.exports = withSass({
  // publicRuntimeConfig: {
  //   ..._.pick(process.env, [
  //     'PLAID_CLIENT_ID',
  //     'PLAID_SECRET',
  //     'PLAID_PUBLIC_KEY',
  //     'SHEETS_SHEET_ID',
  //     'SHEETS_CLIENT_ID',
  //     'SHEETS_CLIENT_SECRET',
  //     'SHEETS_REDIRECT_URI',
  //   ]),
  //   ..._.pickBy(process.env, )
  // }
});
