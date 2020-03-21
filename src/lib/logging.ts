import chalk from 'chalk'
import { argv } from 'yargs'
import { inspect } from 'util'

export enum LogLevel {
    Info = 'info',
    Warn = 'warn',
    Error = 'error'
}

export interface LogRequest {
    level: LogLevel
    message: string
    data?: any
}

export const log = (request: LogRequest): void => {
    const date = chalk.bold(new Date().toISOString())
    const level = chalk.bold(`[${request.level.toUpperCase()}]`)
    const text = `${date} ${level} ${request.message}`

    switch (request.level) {
        case LogLevel.Error:
            console.error(chalk.red(text))
            try {
                console.error('\n', chalk.red(JSON.stringify(request.data, null, 2)), '\n')
            } catch (e) {
                console.error('\n', chalk.red(inspect(request.data)), '\n')
            }
            process.exit(1)
        case LogLevel.Warn:
            console.warn(chalk.yellow(text))
        case LogLevel.Info:
            console.info(text)
    }

    if (argv['debug']) {
        try {
            console.log('\n', JSON.stringify(request.data, null, 2), '\n')
        } catch (e) {
            console.log('\n', inspect(request.data), '\n')
        }
    }
}

export const logError = (message: string, data?: any): void => {
    log({ level: LogLevel.Error, message, data })
}

export const logWarn = (message: string, data?: any): void => {
    log({ level: LogLevel.Warn, message, data })
}

export const logInfo = (message: string, data?: any): void => {
    log({ level: LogLevel.Info, message, data })
}
