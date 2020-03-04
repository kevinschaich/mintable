import { IntegrationConfig } from '../types/integrations'
import { AccountConfig } from '../types/account'
import { BalanceConfig } from '../types/balance'
import { TransactionConfig } from '../types/transaction'
import { logInfo, logError } from '../lib/logging'
const argv = require('yargs').argv
import * as fs from 'fs'
import * as os from 'os'
import { resolve } from 'path'
import * as TJS from 'typescript-json-schema'
import Ajv = require('ajv')

const DEFAULT_CONFIG_FILE = '~/mintable.jsonc'

export interface FileConfig {
  type: 'file'
  path: string
}

export interface EnvironmentConfig {
  type: 'environment'
  variable: string
}

export type ConfigSource = FileConfig | EnvironmentConfig

export interface Config {
  integrations: { [id: string]: IntegrationConfig }
  accounts: AccountConfig[]
  balances: BalanceConfig[]
  transactions: TransactionConfig[]
  debugMode?: boolean
}

export const getConfigSource = (): ConfigSource => {
  if (argv['config-file']) {
    const path = argv['config-file'].replace(/^~(?=$|\/|\\)/, os.homedir())
    logInfo(`Using configuration file \`${path}.\``)
    return { type: 'file', path: path }
  }

  if (argv['config-variable']) {
    logInfo(`Using configuration variable \`${argv['config-variable']}.\``)
    return { type: 'environment', variable: argv['config-variable'] }
  }

  // Default to DEFAULT_CONFIG_FILE
  const path = DEFAULT_CONFIG_FILE.replace(/^~(?=$|\/|\\)/, os.homedir())
  logInfo(`Using default configuration file \`${path}.\``)
  logInfo(`You can supply either --config-file or --config-variable to specify a different configuration.`)
  return { type: 'file', path: path }
}

export const readConfig = (source: ConfigSource): string => {
  if (source.type === 'file') {
    try {
      const config = fs.readFileSync(source.path, 'utf8')
      logInfo('Successfully opened configuration file.')
      return config
    } catch (e) {
      logError('Unable to open configuration file.', e)
      logInfo("You may want to run `yarn setup` if you haven't already.")
    }
  }
  if (source.type === 'environment') {
    try {
      const config = process.env[source.variable]

      if (config === undefined) {
        throw `Variable \`${source.variable}\` not defined in environment.`
      }

      logInfo('Successfully retrieved configuration variable.')
      return config
    } catch (e) {
      logError('Unable to retrieve configuration variable.', e)
    }
  }
}

export const parseConfig = (configString: string): Object => {
  try {
    const parsedConfig = JSON.parse(configString)
    logInfo('Successfully parsed configuration.')
    return parsedConfig
  } catch (e) {
    logError('Unable to parse configuration.', e)
  }
}

export const getConfigSchema = (): TJS.Definition => {
  // Generate JSON schema at runtime for Config interface above
  const settings: TJS.PartialArgs = {
    required: true,
    defaultProps: true,
    noExtraProps: true
  }
  const program = TJS.getProgramFromFiles([resolve(__filename)])
  const configSchema = TJS.generateSchema(program, 'Config', settings)

  return configSchema
}

export const validateConfig = (parsedConfig: Object): Config => {
  const configSchema = getConfigSchema()

  // Validate parsed configuration object against generated JSON schema
  const validator = new Ajv()
  const valid = validator.validate(configSchema, parsedConfig)

  if (!valid) {
    logError('Unable to validate configuration.', validator.errors)
  }

  const validatedConfig = parsedConfig as Config
  logInfo('Successfully validated configuration.')
  return validatedConfig
}

export const getConfig = (): Config => {
  const configSource = getConfigSource()
  const configString = readConfig(configSource)
  const parsedConfig = parseConfig(configString)
  const validatedConfig = validateConfig(parsedConfig)
  return validatedConfig
}

export const writeConfig = (source: ConfigSource, config: Config): void => {
  if (source.type === 'file') {
    try {
      fs.writeFileSync(source.path, JSON.stringify(config, null, 2))
      logInfo('Successfully wrote configuration file.')
    } catch (e) {
      logError('Unable to write configuration file.', e)
    }
  }
  if (source.type === 'environment') {
    logError(
      'Node does not have permissions to modify global environment variables. Please use file-based configuration to make changes.'
    )
  }
}

type ConfigTransformer = (oldConfig: Config) => Config

export const updateConfig = (configTransformer: ConfigTransformer): Config => {
  const configSource = getConfigSource()
  const configString = readConfig(configSource)
  const oldConfig = parseConfig(configString) as Config
  const newConfig = configTransformer(oldConfig)
  const validatedConfig = validateConfig(newConfig)
  writeConfig(configSource, validatedConfig)
  return validatedConfig
}
