'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function(mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
exports.__esModule = true
var logging_1 = require('../lib/logging')
var yargs_1 = require('yargs')
var fs_1 = __importDefault(require('fs'))
var os_1 = __importDefault(require('os'))
var path_1 = require('path')
var typescript_json_schema_1 = require('typescript-json-schema')
var ajv_1 = __importDefault(require('ajv'))
var DEFAULT_CONFIG_FILE = '~/mintable.jsonc'
exports.getConfigSource = function() {
    if (yargs_1.argv['config-file']) {
        var path_2 = yargs_1.argv['config-file'].replace(/^~(?=$|\/|\\)/, os_1['default'].homedir())
        logging_1.logInfo('Using configuration file `' + path_2 + '.`')
        return { type: 'file', path: path_2 }
    }
    if (yargs_1.argv['config-variable']) {
        logging_1.logInfo('Using configuration variable `' + yargs_1.argv['config-variable'] + '.`')
        return { type: 'environment', variable: yargs_1.argv['config-variable'] }
    }
    // Default to DEFAULT_CONFIG_FILE
    var path = DEFAULT_CONFIG_FILE.replace(/^~(?=$|\/|\\)/, os_1['default'].homedir())
    logging_1.logInfo('Using default configuration file `' + path + '.`')
    logging_1.logInfo('You can supply either --config-file or --config-variable to specify a different configuration.')
    return { type: 'file', path: path }
}
exports.readConfig = function(source) {
    if (source.type === 'file') {
        try {
            var config = fs_1['default'].readFileSync(source.path, 'utf8')
            logging_1.logInfo('Successfully opened configuration file.')
            return config
        } catch (e) {
            logging_1.logError('Unable to open configuration file.', e)
            logging_1.logInfo("You may want to run `yarn setup` if you haven't already.")
        }
    }
    if (source.type === 'environment') {
        try {
            var config = process.env[source.variable]
            if (config === undefined) {
                throw 'Variable `' + source.variable + '` not defined in environment.'
            }
            logging_1.logInfo('Successfully retrieved configuration variable.')
            return config
        } catch (e) {
            logging_1.logError('Unable to retrieve configuration variable.', e)
        }
    }
}
exports.parseConfig = function(configString) {
    try {
        var parsedConfig = JSON.parse(configString)
        logging_1.logInfo('Successfully parsed configuration.')
        return parsedConfig
    } catch (e) {
        logging_1.logError('Unable to parse configuration.', e)
    }
}
exports.getConfigSchema = function() {
    // Generate JSON schema at runtime for Config interface above
    var compilerOptions = {
        esModuleInterop: true
    }
    var settings = {
        required: true,
        defaultProps: true,
        noExtraProps: true
    }
    var program = typescript_json_schema_1.getProgramFromFiles([path_1.resolve(__filename)], compilerOptions)
    var configSchema = typescript_json_schema_1.generateSchema(program, 'Config', settings)
    return configSchema
}
exports.validateConfig = function(parsedConfig) {
    var configSchema = exports.getConfigSchema()
    // Validate parsed configuration object against generated JSON schema
    var validator = new ajv_1['default']()
    var valid = validator.validate(configSchema, parsedConfig)
    if (!valid) {
        logging_1.logError('Unable to validate configuration.', validator.errors)
    }
    var validatedConfig = parsedConfig
    logging_1.logInfo('Successfully validated configuration.')
    return validatedConfig
}
exports.getConfig = function() {
    var configSource = exports.getConfigSource()
    var configString = exports.readConfig(configSource)
    var parsedConfig = exports.parseConfig(configString)
    var validatedConfig = exports.validateConfig(parsedConfig)
    return validatedConfig
}
exports.writeConfig = function(source, config) {
    if (source.type === 'file') {
        try {
            fs_1['default'].writeFileSync(source.path, JSON.stringify(config, null, 2))
            logging_1.logInfo('Successfully wrote configuration file.')
        } catch (e) {
            logging_1.logError('Unable to write configuration file.', e)
        }
    }
    if (source.type === 'environment') {
        logging_1.logError(
            'Node does not have permissions to modify global environment variables. Please use file-based configuration to make changes.'
        )
    }
}
exports.updateConfig = function(configTransformer) {
    var configSource = exports.getConfigSource()
    var configString = exports.readConfig(configSource)
    var oldConfig = exports.parseConfig(configString)
    var newConfig = configTransformer(oldConfig)
    var validatedConfig = exports.validateConfig(newConfig)
    exports.writeConfig(configSource, validatedConfig)
    return validatedConfig
}
