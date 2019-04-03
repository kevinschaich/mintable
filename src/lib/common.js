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
  CATEGORY_OVERRIDES: []
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

module.exports = {
  getConfigEnv,
  writeConfigProperty,
  writeConfig,
  maybeWriteDefaultConfig
};
