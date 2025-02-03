export type Levels = 'silly' | 'debug' | 'verbose' | 'info' | 'warn' | 'error'

export function logger (
  level: Levels,
  message: string[] | string,
  context?: object
): Promise<void>

export function logConfig(
  options?: LogConfigOptions
): void

interface LogConfigOptions {
  remote?: {
    disabled?: boolean
    onlyInProd?: boolean
    host?: string
    token?: string
    level?: Levels
  }
  betterstack?: {
    disabled?: boolean
    onlyInProd?: boolean
    host?: string
    token?: string
    level?: Levels
  }
  teams?: {
    disabled?: boolean
    onlyInProd?: boolean
    url?: string
    level?: Levels
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
  error?: {
    useMessage?: boolean
  }
}
