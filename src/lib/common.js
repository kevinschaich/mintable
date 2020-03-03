// const fs = require('fs')
// const _ = require('lodash')
// const path = require('path')
// const { wrapPromise } = require('./logging')

// const CONFIG_FILE = path.join(__dirname, '../..', process.argv[2] || 'mintable.config.json')

// export const config = async options => {
//   let config = process.env.MINTABLE_CONFIG || fs.readFileSync(CONFIG_FILE, 'utf8')

//   // passed in as environment variable
//   if (typeof config === 'string') {
//     config = JSON.parse(config)
//   }

//   process.env = { ...process.env, ...config }
// }

// const sanitizeConfig = config => {
//   // recurse configuration objects and arrays to remove whitespace
//   const sanitize = (chunk) => {
//     return _.reduce(chunk, (result, v, k) => {
//       if (_.isObject(v) || _.isArray(v)) {
//         result[k] = sanitize(v);
//       } else if (_.isString()) {
//         result[k] = _.trim(v);
//       } else {
//         result[k] = v;
//       }

//       return result;
//     }, _.isArray(chunk) ? [] : {})
//   }

//   return sanitize(config);
// }

// const writeConfig = async newConfig =>
//   wrapPromise(
//     new Promise(async (resolve, reject) => {
//       fs.writeFileSync(CONFIG_FILE, JSON.stringify(sanitizeConfig(newConfig), null, 2))
//       resolve(getConfigEnv())
//     }),
//     'Writing config'
//   )

// const updateConfig = async updates => {
//   const currentConfig = await getConfigEnv()
//   const newConfig = { ...currentConfig, ...updates }
//   return wrapPromise(writeConfig(newConfig), `Updating config properties ${_.join(_.keys(updates), ', ')}`)
// }

// const deleteConfigProperty = async propertyId => {
//   delete process.env[propertyId]
//   const newConfig = _.omit(await getConfigEnv(), [propertyId])
//   return wrapPromise(writeConfig(newConfig), `Deleting config property ${propertyId}`)
// }

// const maybeWriteDefaultConfig = async () => {
//   return wrapPromise(
//     getConfigEnv({ quiet: true })
//       .then(currentConfig => writeConfig({ ...DEFAULT_CONFIG, ...currentConfig }))
//       .catch(writeConfig({ ...DEFAULT_CONFIG })),
//     'Writing default config'
//   )
// }

module.exports = {
  // getConfigEnv,
  // updateConfig,
  // deleteConfigProperty,
  // writeConfig,
  // maybeWriteDefaultConfig,
  // getAccountTokens,
  // accountSetupComplete,
  // accountProviderSetupComplete,
  // sheetProviderSetupComplete
}
