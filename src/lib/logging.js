const ora = require('ora')
const logSymbols = require('log-symbols')
const indentString = require('indent-string')
const { inspect } = require('util')

const paddedJSON = data => {
  return indentString(`\n\n${inspect(data)}\n`, 4)
}

const defaultOptions = {
  debug: false, // Print success output    (default: only error output printed)
  quiet: false // Don't exit on failures  (default: exit on failures)
}

const logPromise = async (promise, text, options = defaultOptions) => {
  const spinner = ora({ text: text + '...', indent: 2 }).start()

  return new Promise(async (resolve, reject) => {
    let text = spinner.text.replace('...', '')
    await promise

      // Successful execution
      .then(data => {
        spinner.stopAndPersist({
          text: options.debug ? text + paddedJSON(data) : text,
          symbol: logSymbols.success
        })
        resolve(data)
      })

      // Failed execution
      .catch(error => {
        text = `Error ${text}:`
        let errorJSON = { error: JSON.stringify(error) }

        if (error.message) {
          errorJSON = { error: error.toString() }
        }

        spinner.stopAndPersist({
          symbol: logSymbols.error,
          text: text + paddedJSON(errorJSON)
        })

        if (options.quiet === false) {
          process.exit(1)
        } else {
          resolve()
        }
      })
  })
}

module.exports = {
  logPromise
}
