const fs = require("fs");

const CONFIG_FILE = '../mintable.config.json';
exports.CONFIG_FILE = CONFIG_FILE;

exports.getConfigEnv = () => {
  const config = fs.readFileSync(CONFIG_FILE);
  process.env = {
    ...process.env,
    ...JSON.parse(config)
  };
};

exports.parseEnvOrDefault = (key, defaultValue) => {
  const value = process.env[key];
  if (value) {
    const parsed = JSON.parse(value);
    if (parsed) {
      return parsed;
    }
  }
  return defaultValue;
};
