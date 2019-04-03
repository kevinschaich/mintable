const fs = require('fs');
const CONFIG_FILE = '../mintable.config.json';

const getConfigEnv = () => {
  try {
    const config = fs.readFileSync(CONFIG_FILE);
    process.env = {
      ...process.env,
      ...JSON.parse(config)
    };
    return JSON.parse(config);
  } catch (e) {
    const message = 'Error: Could not read config file. ' + err.message;
    console.log(message);
    return false;
  }
};

const writeConfigProperty = (propertyId, value) => {
  const newConfig = {
    ...getConfigEnv(),
    [propertyId]: value
  };

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    return getConfigEnv();
  } catch (e) {
    const message = 'Error: Could not write config file. ' + err.message;
    console.log(message);
    return false;
  }
};

const parseEnvOrDefault = (key, defaultValue) => {
  const value = process.env[key];
  if (value) {
    const parsed = JSON.parse(value);
    if (parsed) {
      return parsed;
    }
  }
  return defaultValue;
};

module.exports = {
  getConfigEnv,
  writeConfigProperty,
  parseEnvOrDefault
};
