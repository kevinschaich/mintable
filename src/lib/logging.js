'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function(mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
exports.__esModule = true
var chalk_1 = __importDefault(require('chalk'))
var LogLevel
;(function(LogLevel) {
    LogLevel['Info'] = 'info'
    LogLevel['Warn'] = 'warn'
    LogLevel['Error'] = 'error'
})((LogLevel = exports.LogLevel || (exports.LogLevel = {})))
exports.log = function(request) {
    var date = chalk_1['default'].bold(new Date().toISOString())
    var level = chalk_1['default'].bold('[' + request.level.toUpperCase() + ']')
    var text = date + ' ' + level + ' ' + request.message
    switch (request.level) {
        case LogLevel.Error:
            console.error(chalk_1['default'].red(text))
            console.error('\n', chalk_1['default'].red(JSON.stringify(request.data, null, 2)), '\n')
            process.exit(1)
        case LogLevel.Warn:
            console.warn(chalk_1['default'].yellow(text))
        case LogLevel.Info:
            console.info(text)
    }
    // if (config.debugMode) {
    //   console.log(request.data)
    // }
}
exports.logError = function(message, data) {
    exports.log({ level: LogLevel.Error, message: message, data: data })
}
exports.logWarn = function(message, data) {
    exports.log({ level: LogLevel.Warn, message: message, data: data })
}
exports.logInfo = function(message, data) {
    exports.log({ level: LogLevel.Info, message: message, data: data })
}
