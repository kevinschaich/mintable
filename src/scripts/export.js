const _ = require('lodash')
const { getConfigEnv } = require('../lib/common')
const clipboard = require('clipboardy')

const config = getConfigEnv()

console.log(
  '\nThis script will export your Mintable config as a string you can copy into CI environments like CircleCI and Travis CI.'
)
console.log('\n1. Create an environment variable called MINTABLE_CONFIG in your CI.')
console.log('2. Copy the config below into your CI and paste it as the value.\n')
console.log(JSON.stringify(config))
clipboard.writeSync(JSON.stringify(config))
console.log('\n3. Done!')
