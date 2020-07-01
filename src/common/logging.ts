const chalk = require('chalk')
import { argv } from 'yargs'
import { inspect } from 'util'
import * as os from 'os'

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
            console.error('\n', chalk.red(inspect(request.data, true, 10)), '\n')

            const searchIssuesLink = encodeURI(
                `https://github.com/kevinschaich/mintable/issues?q=is:issue+${request.message}`
            )
            const searchIssuesHelpText = `You can check if anybody else has encountered this issue on GitHub:\n${searchIssuesLink}\n`
            console.warn(chalk.yellow(searchIssuesHelpText))

            const systemInfo = `arch: ${os.arch()}\nplatform: ${os.platform()}\nos: v${os.release()}\nmintable: v${
                require('../../package.json').version
            }\nnode: ${process.version}`
            const reportIssueBody =
                '**Steps to Reproduce:**\n\n1.\n2.\n3.\n\n**Error:**\n\n```\n<Paste Full Error Content Here>\n```\n\n**System Info:**\n\n```\n' +
                systemInfo +
                '\n```'
            const reportIssueLink = encodeURI(
                `https://github.com/kevinschaich/mintable/issues/new?title=Error:+${request.message}&body=${reportIssueBody}`
            )
            const reportIssueHelpText = `If this is a new issue, please use this link to report it:\n${reportIssueLink}\n`
            console.warn(chalk.yellow(reportIssueHelpText))

            process.exit(1)
        case LogLevel.Warn:
            console.warn(chalk.yellow(text))
            break
        case LogLevel.Info:
            console.info(text)
            break
        default:
            break
    }

    if (argv['debug']) {
        try {
            console.log('\n', inspect(request.data, true, 10), '\n')
        } catch (e) {
            console.log('\n', JSON.stringify(request.data, null, 2), '\n')
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
