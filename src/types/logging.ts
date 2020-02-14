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
