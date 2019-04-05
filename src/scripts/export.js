const { getConfigEnv } = require('../lib/common')
const clipboard = require('clipboardy')

const config = getConfigEnv()

clipboard.writeSync(JSON.stringify(config))

console.log('Copied mintable.config.json string to clipboard.')
console.log('To use with CI (like Circle/Travis), create an environment variable called MINTABLE_CONFIG and paste the result.')
