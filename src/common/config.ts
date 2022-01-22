import { IntegrationConfig, IntegrationId } from '../types/integrations'
import { AccountConfig } from '../types/account'
import { TransactionConfig } from '../types/transaction'
import { logInfo, logError } from './logging'
import { argv } from 'yargs'
import * as fs from 'fs'
import * as os from 'os'
import { resolve, join } from 'path'
import { Definition, CompilerOptions, PartialArgs, getProgramFromFiles, generateSchema } from 'typescript-json-schema'
import Ajv from 'ajv'
import { BalanceConfig } from '../types/balance'
import { jsonc } from 'jsonc'
import { SecretsManagerClient, PutSecretValueCommand, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const REGION = "us-east-1";
const secretsManagerClient = new SecretsManagerClient({ region: REGION });

const DEFAULT_CONFIG_FILE = '~/mintable.jsonc'
const DEFAULT_CONFIG_VAR = 'MINTABLE_CONFIG'

const DEFAULT_CONFIG: Config = {
    accounts: {},
    transactions: {
        integration: IntegrationId.Google,
        properties: ['date', 'amount', 'name', 'account', 'category']
    },
    balances: {
        integration: IntegrationId.Google,
        properties: ['institution', 'account', 'type', 'current', 'available', 'limit', 'currency']
    },
    integrations: {}
}

export interface FileConfig {
    type: 'file'
    path: string
}

export interface EnvironmentConfig {
    type: 'environment'
    variable: string
}

export interface SecretManagerConfig {
    type: 'secretManager'
    secretName: string
}

export type ConfigSource = FileConfig | EnvironmentConfig | SecretManagerConfig

export interface Config {
    integrations: { [id: string]: IntegrationConfig }
    accounts: { [id: string]: AccountConfig }
    transactions: TransactionConfig
    balances: BalanceConfig
}

export const getConfigSource = (): ConfigSource => {
    if (argv['config-file']) {
        const path = argv['config-file'].replace(/^~(?=$|\/|\\)/, os.homedir())
        logInfo(`Using configuration file \`${path}.\``)
        return { type: 'file', path: path }
    }

    if (process.env[DEFAULT_CONFIG_VAR]) {
        logInfo(`Using configuration variable '${DEFAULT_CONFIG_VAR}.'`)
        return { type: 'environment', variable: DEFAULT_CONFIG_VAR }
    }

    if (process.env.SECRET_MANAGER_ARN) {
        logInfo(`Using Secrets Manager.`)
        return { type: 'secretManager', secretName: process.env.SECRET_MANAGER_NAME }
    }

    // Default to DEFAULT_CONFIG_FILE
    const path = DEFAULT_CONFIG_FILE.replace(/^~(?=$|\/|\\)/, os.homedir())
    logInfo(`Using default configuration file \`${path}.\``)
    logInfo(`You can supply either --config-file or --config-variable to specify a different configuration.`)
    return { type: 'file', path: path }
}

export const readConfig = async (source: ConfigSource, checkExists?: boolean): Promise<string> => {
    if (source.type === 'file') {
        try {
            const config = fs.readFileSync(source.path, 'utf8')
            logInfo('Successfully opened configuration file.')
            return config
        } catch (e) {
            if (checkExists) {
                logInfo('Unable to open config file.')
            } else {
                logError('Unable to open configuration file.', e)
                logInfo("You may want to run `mintable setup` (or `mintable migrate`) if you haven't already.")
            }
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
            if (!checkExists) {
                logInfo('Unable to read config variable from env.')
            } else {
                logError('Unable to read config variable from env.', e)
            }
        }
    }
    if (source.type === 'secretManager') {
        try {

            const secret = await secretsManagerClient.send(new GetSecretValueCommand({
                SecretId: source.secretName
            }));
            const config = secret.SecretString;
            
            if (config === undefined) {
                throw `Unable to get config from Secrets Manager.`
            }

            logInfo('Successfully retrieved configuration variable.')
            return config
        } catch (e) {
            if (!checkExists) {
                logInfo('Unable to read config variable from secrets manager.')
            } else {
                logError('Unable to read config variable from secrets manager', e)
            }
        }
    }
}

export const parseConfig = (configString: string): Object => {
    try {
        const parsedConfig = jsonc.parse(configString)
        logInfo('Successfully parsed configuration.')
        return parsedConfig
    } catch (e) {
        logError('Unable to parse configuration.', e)
    }
}

export const getConfigSchema = (): Definition => {
    const basePath = resolve(join(__dirname, '../..'))
    const config = resolve(join(basePath, 'src/common/config.ts'))
    const tsconfig = require(resolve(join(basePath, 'tsconfig.json')))
    const types = resolve(join(basePath, 'node_modules/@types'))

    // Generate JSON schema at runtime for Config interface above
    const compilerOptions: CompilerOptions = {
        ...tsconfig.compilerOptions,
        typeRoots: [types],
        baseUrl: basePath
    }

    const settings: PartialArgs = {
        required: true,
        defaultProps: true,
        noExtraProps: true
    }

    try {
        const program = getProgramFromFiles([config], compilerOptions, basePath)
        const configSchema = generateSchema(program, 'Config', settings)

        return configSchema
    } catch (e) {
        logError('Could not generate config schema.', e)
    }
}

export const validateConfig = (parsedConfig: Object): Config => {
    const configSchema = getConfigSchema()

    // Validate parsed configuration object against generated JSON schema
    try {
        const validator = new Ajv()
        const valid = validator.validate(configSchema, parsedConfig)

        if (!valid) {
            logError('Unable to validate configuration.', validator.errors)
        }
    } catch (e) {
        logError('Unable to validate configuration.', e)
    }

    const validatedConfig = parsedConfig as Config
    logInfo('Successfully validated configuration.')
    return validatedConfig
}

export const getConfig = async (): Promise<Config> => {
    const configSource = getConfigSource()
    const configString = await readConfig(configSource)
    const parsedConfig = parseConfig(configString)
    const validatedConfig = validateConfig(parsedConfig)
    return validatedConfig
}

export const writeConfig = async (source: ConfigSource, config: Config): Promise<void> => {
    if (source.type === 'file') {
        try {
            fs.writeFileSync(source.path, jsonc.stringify(config, null, 2))
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
    if (source.type === 'secretManager') {
        try {
            const putSecretValue = new PutSecretValueCommand({
                SecretId: source.secretName,
                SecretString: jsonc.stringify(config, null, 2)
            });
            await secretsManagerClient.send(putSecretValue);
            logInfo('Successfully wrote configuration file.')
        } catch (e) {
            logError('Unable to write configuration file.', e)
        }
    }
}

type ConfigTransformer = (oldConfig: Config) => Config

export const updateConfig = async (configTransformer: ConfigTransformer, initialize?: boolean): Promise<Config> => {
    let newConfig: Config
    const configSource = getConfigSource()

    if (initialize) {
        newConfig = configTransformer(DEFAULT_CONFIG)
    } else {
        const configString = await readConfig(configSource)
        const oldConfig = parseConfig(configString) as Config
        newConfig = configTransformer(oldConfig)
    }

    const validatedConfig = validateConfig(newConfig)
    await writeConfig(configSource, validatedConfig)
    return validatedConfig
}
