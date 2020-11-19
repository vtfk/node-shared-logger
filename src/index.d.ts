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
    azure?: {
      context?: {
        invocationId?: string
        log?: {
          error: () => void
          warn: () => void
          info: () => void
          verbose: () => void
        }
      }
      excludeInvocationId?: boolean
    }
    prefix?: string
    suffix?: string
    localLogger?: (message: any) => void
  }
}
