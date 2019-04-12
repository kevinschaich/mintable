const { getConfigEnv } = require('../lib/common')
const clipboard = require('clipboardy')
const { wrapPromise } = require('../lib/logging')

;(async () => {
  const config = await getConfigEnv()

  await wrapPromise(clipboard.write(JSON.stringify(config)), 'Copying config to clipboard')

  console.log(
    '\nTo use with CI (like Circle/Travis), create an environment variable called MINTABLE_CONFIG and paste the above result as the value.\n'
  )
})()
