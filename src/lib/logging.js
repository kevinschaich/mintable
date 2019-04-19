const ora = require('ora')
const logSymbols = require('log-symbols')
const indentString = require('indent-string')
const { inspect } = require('util')

const paddedJSON = data => {
  return indentString(`\n\n${inspect(data)}\n`, 4)
}

const defaultOptions = {
  debug: false, // Print success output    (default: only error output printed)
  quiet: false // Resolve even on failures  (default: reject on failures)
}

const wrapPromise = async (promise, text, options = defaultOptions) => {
  const spinner = ora({ text: text + '...', indent: 2 }).start()

  return new Promise(async (resolve, reject) => {
    let text = spinner.text.replace('...', '')
    return promise
      .then(data => {
        spinner.stopAndPersist({
          text: options.debug ? text + paddedJSON(data) : text,
          symbol: logSymbols.success
        })
        resolve(data)
      })
      .catch(error => {
        text = `Error ${text.toLowerCase()}:`
        let errorJSON = { error: error }

        if (error.message) {
          errorJSON = { error: error.toString() }
        }

        spinner.stopAndPersist({
          symbol: logSymbols.error,
          text: text + paddedJSON(errorJSON)
        })

        if (options.quiet === true) {
          resolve()
        } else {
          reject(errorJSON)
          process.exit(1)
        }
      })
  })
}

module.exports = {
  wrapPromise
}
