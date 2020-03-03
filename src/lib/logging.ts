// import { config } from './common'
const chalk = require('chalk')

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

export const log = (request: LogRequest) => {
  const date = chalk.bold(new Date().toISOString())
  const level = chalk.bold(`[${request.level.toUpperCase()}]`)
  const text = `${date} ${level} ${request.message}`

  switch (request.level) {
    case LogLevel.Error:
      console.error(chalk.red(text))
      console.error('\n', chalk.red(JSON.stringify(request.data, null, 2)), '\n')
      process.exit(1)
    case LogLevel.Warn:
      console.warn(chalk.yellow(text))
    case LogLevel.Info:
      console.info(text)
  }

  // if (config.debugMode) {
  //   console.log(request.data)
  // }
}

export const logError = (message: string, data?: any) => {
  log({ level: LogLevel.Error, message, data })
}

export const logWarn = (message: string, data?: any) => {
  log({ level: LogLevel.Warn, message, data })
}

export const logInfo = (message: string, data?: any) => {
  log({ level: LogLevel.Info, message, data })
}
