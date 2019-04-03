const fs = require('fs');
const _ = require('lodash');

const CONFIG_FILE = '../mintable.config.json';
const DEFAULT_CONFIG = {
  TRANSACTION_COLUMNS: [
    'date',
    'amount',
    'name',
    'account_details.official_name',
    'category.0',
    'category.1',
    'pending'
  ],
  REFERENCE_COLUMNS: ['notes', 'work', 'joint'],
  SPREADSHEET_PROVIDER: 'sheets',
  TRANSACTION_PROVIDER: 'plaid',
  CATEGORY_OVERRIDES: [],
  SHEETS_REDIRECT_URI: 'http://localhost:3000/google-sheets-oauth2callback',
  FETCH_ACCOUNTS: 'true'
};

const getConfigEnv = () => {
  try {
    const config = fs.readFileSync(CONFIG_FILE);
    process.env = {
      ...process.env,
      ...JSON.parse(config)
    };
    return JSON.parse(config);
  } catch (e) {
    console.log('Error: Could not read config file. ' + e.message);
    return false;
  }
};

const writeConfig = newConfig => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    return getConfigEnv();
  } catch (e) {
    console.log('Error: Could not write config file. ' + e.message);
    return false;
  }
};

const writeConfigProperty = (propertyId, value) => {
  const newConfig = {
    ...getConfigEnv(),
    [propertyId]: value
  };

  writeConfig(newConfig);
};

const maybeWriteDefaultConfig = () => {
  const currentConfig = getConfigEnv();

  if (!_.every(_.keys(DEFAULT_CONFIG), _.partial(_.has, currentConfig))) {
    writeConfig({
      ...DEFAULT_CONFIG,
      ...(currentConfig || {})
    });
    console.log('Wrote default config.');
  }
};

const checkEnv = propertyIds => {
  const values = _.values(_.pick(process.env, propertyIds));
  return values.length === propertyIds.length && _.every(values, v => v.length);
};

const accountsSetupCompleted = () => {
  if (!process.env) {
    return false;
  }

  switch (process.env.TRANSACTION_PROVIDER) {
    case 'plaid':
      return checkEnv(['PLAID_CLIENT_ID', 'PLAID_PUBLIC_KEY', 'PLAID_SECRET']);
    default:
      return false;
  }
};

const sheetsSetupCompleted = () => {
  if (!process.env) {
    return false;
  }

  switch (process.env.SPREADSHEET_PROVIDER) {
    case 'sheets':
      return checkEnv([
        'SHEETS_SHEET_ID',
        'SHEETS_CLIENT_ID',
        'SHEETS_CLIENT_SECRET',
        'SHEETS_REDIRECT_URI',
        'SHEETS_ACCESS_TOKEN'
      ]);
    default:
      return false;
  }
};

module.exports = {
  getConfigEnv,
  writeConfigProperty,
  writeConfig,
  maybeWriteDefaultConfig,
  accountsSetupCompleted,
  sheetsSetupCompleted
};
