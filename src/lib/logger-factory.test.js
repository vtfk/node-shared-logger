const loggerFactory = require('./logger-factory')
const logLevelMapper = require('./log-level-mapper')

function matchLogMessage (message) {
  const logMessageMatcher = /^\[ (?<dateTime>\d{1,2}\/\d{1,2}\/\d{4} \d{2}:\d{2}:\d{2}) \] < (?<level>\w{1,10}) > ([^:]*: |)(?<message>.*$)/
  const match = message.match(logMessageMatcher)
  if (match === null) return null
  return {
    fullMatch: match[0],
    ...match.groups
  }
}

function createLogger (fakeDeps) {
  const mergedFakeDeps = {
    formatDateTime: jest.fn((date) => ({ fDate: '00/0/0000', fTime: '00:00:00' })),
    logLevelMapper: jest.fn(logLevelMapper),
    loggerOptions: {
      localLogger: jest.fn((message) => {}),
      remoteLogger: {
        log: jest.fn((message, options) => {})
      }
    },
    pkg: {},
    inProduction: false,
    ...fakeDeps
  }
  return {
    logger: (level, message) => loggerFactory(level, message, mergedFakeDeps),
    mergedFakeDeps
  }
}

describe('Checking parameters', () => {
  it('logs a string if \'message\' is an array', () => {
    const { logger, mergedFakeDeps } = createLogger()
    logger('info', ['array', 123])
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('array - 123')
  })

  it('logs a string if \'message\' is a string', () => {
    const { logger, mergedFakeDeps } = createLogger()
    logger('info', 'string message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('string message')
  })

  it('logs a string if \'message\' is an int', () => {
    const { logger, mergedFakeDeps } = createLogger()
    logger('info', 123)
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('123')
  })

  it('logs a string if \'message\' is undefined', () => {
    const { logger, mergedFakeDeps } = createLogger()
    logger('info', 123)
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toBeString()
  })

  it('logs a string if \'message\' is an object', () => {
    const { logger, mergedFakeDeps } = createLogger()
    logger('info', { myKey: 'thisValue', my2ndKey: 'otherValue' })
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('{"myKey":"thisValue","my2ndKey":"otherValue"}')
  })
})

describe('Syslog severity testing', () => {
  it('throws if syslogSeverity is undefined and not in production', () => {
    const { logger } = createLogger({
      inProduction: false,
      logLevelMapper: logLevelMapper
    })
    expect(() => logger('unknown', 'msg')).toThrow()
    expect(() => logger()).toThrow()
  })

  it('does not throw if syslogSeverity is undefined and is in production', () => {
    const { logger } = createLogger({
      inProduction: true,
      logLevelMapper: logLevelMapper
    })
    expect(() => logger('unknown', 'msg')).not.toThrow()
    expect(() => logger()).not.toThrow()
  })
})

describe('Prefix & suffix testing', () => {
  it('add an prefix if prefix is a string', () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        prefix: 'testPrefix'
      }
    })
    logger('info', 'message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('testPrefix')
  })

  it('add an suffix if suffix is a string', () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        suffix: 'testSuffix'
      }
    })
    logger('info', 'message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('testSuffix')
  })

  it('checks if suffix is at the end of the message', () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        suffix: 'testSuffix'
      }
    })
    logger('info', 'message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toEndWith('message - testSuffix')
  })

  it('checks if prefix is at the start of the message', () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        prefix: 'testPrefix'
      }
    })
    logger('info', 'message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toEndWith('testPrefix - message')
  })

  it('checks that format is \'prefix - message - suffix\'', () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        prefix: 'testPrefix',
        suffix: 'testSuffix'
      }
    })
    logger('info', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toEndWith('testPrefix - testMessage - testSuffix')
  })

  const objectArrayIntValues = [{ a: 123 }, [123, '456'], 123]
  objectArrayIntValues.forEach(value => {
    it(`throws if prefix is ${Array.isArray(value) ? 'array' : typeof value}`, () => {
      const { logger } = createLogger({
        loggerOptions: {
          localLogger: () => {},
          prefix: value
        }
      })
      expect(() => logger('info', 'message')).toThrow()
    })
  })

  objectArrayIntValues.forEach(value => {
    it(`throws if suffix is ${Array.isArray(value) ? 'array' : typeof value}`, () => {
      const { logger } = createLogger({
        loggerOptions: {
          localLogger: () => {},
          suffix: value
        }
      })
      expect(() => logger('info', 'message')).toThrow()
    })
  })
})

describe('Message level', () => {
  it('checks that level info is added and in upper case', () => {
    const { logger, mergedFakeDeps } = createLogger()

    logger('info', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(matchLogMessage(localLogger).level).toBe('INFO')
  })

  it('checks that level error is added and in upper case', () => {
    const { logger, mergedFakeDeps } = createLogger()

    logger('error', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(matchLogMessage(localLogger).level).toBe('ERROR')
  })
})

describe('Date and time', () => {
  it('adds the date and time at correct location', () => {
    const { logger, mergedFakeDeps } = createLogger({
      formatDateTime: jest.fn((date) => ({ fDate: '00/0/0000', fTime: '00:00:00' }))
    })

    logger('info', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(matchLogMessage(localLogger).dateTime).toBe('00/0/0000 00:00:00')
  })
  it('Checks that it adds the date and time at correct location, test 2', () => {
    const { logger, mergedFakeDeps } = createLogger({
      formatDateTime: jest.fn((date) => ({ fDate: '12/3/4567', fTime: '12:34:56' }))
    })

    logger('info', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(matchLogMessage(localLogger).dateTime).toBe('12/3/4567 12:34:56')
  })
})

describe('Should it log to remote?', () => {
  [
    { inProduction: true, onlyInProd: true, logToRemote: true, shouldLog: true },
    { inProduction: false, onlyInProd: true, logToRemote: true, shouldLog: false },
    { inProduction: true, onlyInProd: false, logToRemote: true, shouldLog: true },
    { inProduction: false, onlyInProd: false, logToRemote: true, shouldLog: true },
    { inProduction: true, onlyInProd: true, logToRemote: false, shouldLog: false },
    { inProduction: false, onlyInProd: true, logToRemote: false, shouldLog: false },
    { inProduction: true, onlyInProd: false, logToRemote: false, shouldLog: false },
    { inProduction: false, onlyInProd: false, logToRemote: false, shouldLog: false }
  ].forEach(testCase => {
    it(`${testCase.shouldLog ? 'yes, ' : 'no,  '}if: inProduction = ${testCase.inProduction}, onlyInProd = ${testCase.onlyInProd}, logToRemote = ${testCase.logToRemote}`, () => {
      const { logger, mergedFakeDeps } = createLogger({
        inProduction: testCase.inProduction,
        loggerOptions: {
          localLogger: () => {},
          remoteLogger: {
            log: jest.fn((message, options) => {})
          },
          onlyInProd: testCase.onlyInProd,
          logToRemote: testCase.logToRemote
        }
      })

      logger('info', 'msg')

      const remoteLogger = mergedFakeDeps.loggerOptions.remoteLogger
      if (testCase.shouldLog) {
        expect(remoteLogger.log).toHaveBeenCalled()
      } else {
        expect(remoteLogger.log).not.toHaveBeenCalled()
      }
    })
  })
})

describe('Logging to remote', () => {
  [
    { logToRemote: true, shouldLog: true },
    { logToRemote: false, shouldLog: false }
  ].forEach(testCase => {
    it(`should return ${testCase.shouldLog} when ${testCase.shouldLog ? '' : 'not '}logging to remote`, () => {
      const { logger } = createLogger({
        inProduction: true,
        loggerOptions: {
          localLogger: () => {},
          remoteLogger: {
            log: () => {}
          },
          logToRemote: testCase.logToRemote
        }
      })

      const loggedToRemote = logger('info', 'msg')

      expect(loggedToRemote).toBe(testCase.shouldLog)
    })
  })
})

describe('Checking logging with Azure context', () => {
  it('appends invocationId to prefix', () => {
    const invocationId = '02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4'
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        azure: {
          invocationId: invocationId,
          log: {
            info: jest.fn((host, options) => ({}))
          }
        }
      }
    })

    logger('info', ['array', 123])

    const azure = mergedFakeDeps.loggerOptions.azure.log.info.mock.calls[0][0]
    console.log(azure)
    expect(azure).toMatch(new RegExp(`^${invocationId}`))
  })

  it('does not append invocationId to prefix if loggerOptions.azure.excludeInvocationId is true', () => {
    const invocationId = '02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4'
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        azure: {
          invocationId: invocationId,
          excludeInvocationId: true,
          log: {
            info: jest.fn((host, options) => ({}))
          }
        }
      }
    })

    logger('info', ['array', 123])

    const azure = mergedFakeDeps.loggerOptions.azure.log.info.mock.calls[0][0]
    expect(azure).not.toMatch(new RegExp(`^${invocationId}`))
  })

  it('does not log to local', () => {
    const invocationId = '02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4'
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        azure: {
          invocationId: invocationId,
          log: {
            error: jest.fn((host, options) => ({})),
            warn: jest.fn((host, options) => ({})),
            info: jest.fn((host, options) => ({})),
            verbose: jest.fn((host, options) => ({}))
          }
        }
      }
    })

    logger('info', ['array', 123])
    const localLogger = mergedFakeDeps.loggerOptions.localLogger
    expect(localLogger).not.toHaveBeenCalled()
  })

  const tests = [
    { level: 'error', toBeCalled: 'error' },
    { level: 'warn', toBeCalled: 'warn' },
    { level: 'info', toBeCalled: 'info' },
    { level: 'verbose', toBeCalled: 'verbose' },
    { level: 'debug', toBeCalled: 'verbose' },
    { level: 'silly', toBeCalled: 'verbose' }
  ]

  tests.forEach(test => {
    it(`logs to context.logs.${test.toBeCalled} on ${test.level} level`, () => {
      const invocationId = '02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4'
      const { logger, mergedFakeDeps } = createLogger({
        loggerOptions: {
          localLogger: jest.fn((message) => {}),
          azure: {
            invocationId: invocationId,
            log: {
              error: jest.fn((host, options) => ({})),
              warn: jest.fn((host, options) => ({})),
              info: jest.fn((host, options) => ({})),
              verbose: jest.fn((host, options) => ({}))
            }
          }
        }
      })

      logger(test.level, ['array', 123])

      const azure = mergedFakeDeps.loggerOptions.azure
      expect(azure.log[test.toBeCalled]).toHaveBeenCalled()
    })
  })
})
