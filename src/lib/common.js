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
