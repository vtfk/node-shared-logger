declare module '@vtfk/logger' {
  export type Levels = 'silly' | 'debug' | 'verbose' | 'info' | 'warn' | 'error'

  export function logger (
    level: Levels,
    message: string[] | string
  ): void

  export function logConfig(
    options?: LogConfigOptions
  ): void

  interface LogConfigOptions {
    remote?: {
      onlyInProd?: boolean
      host?: string
      port?: string
      serviceHostname?: string
      serviceAppname?: string
    }
    prefix?: string
    suffix?: string
    localLogger?: (message: any) => void
  }
}
