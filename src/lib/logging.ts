import { config } from './common'
import { LogRequest, LogLevel } from '../types/logging'

export const log = (request: LogRequest) => {
  switch (request.level) {
    case LogLevel.Error:
      console.error(request.message)
      process.exit(1)
    case LogLevel.Warn:
      console.warn(request.message)
    case LogLevel.Info:
      console.info(request.message)
  }

  if (config.debugMode) {
    console.log(request.data)
  }
}
