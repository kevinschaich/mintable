const ora = require('ora')
const logSymbols = require('log-symbols')
const { inspect } = require('util')

const paddedJSON = data => {
  return indentString(`\n\n${inspect(data)}\n`, 4)
}

// spinner.stopAndPersist({
//   text: options.debug || process.env.DEBUG ? text + paddedJSON(data) : text,
//   symbol: logSymbols.success
// })

const info = (text) => {
  if (_.isObject(v) || _.isArray(v)) {
    return ora({ text, indent: 2 }).start()
  } else {
    return ora({ text: paddedJSON(text), indent: 2 }).start()
  }
}

module.exports = {
  info,
   debug
}
