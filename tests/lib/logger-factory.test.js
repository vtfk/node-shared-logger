const matchers = require('jest-extended')
const loggerFactory = require('../../src/lib/logger-factory')
const logLevelMapper = require('../../src/lib/log-level-mapper')

expect.extend(matchers)

function matchLogMessage (message) {
  const logMessageMatcher = /^\[ (?<dateTime>\d{1,2}.\d{1,2}.\d{4} \d{2}:\d{2}:\d{2}) \] < (?<level>\w{1,10}) > ([^:]*: |)(?<message>.*$)/
  const match = message.match(logMessageMatcher)
  if (match === null) return null
  return {
    fullMatch: match[0],
    ...match.groups
  }
}

function createLogger (fakeDeps) {
  const mergedFakeDeps = {
    formatDateTime: jest.fn((date) => ({ fDate: '00.00.0000', fTime: '00:00:00' })),
    logLevelMapper: jest.fn(logLevelMapper),
    loggerOptions: {
      localLogger: jest.fn((message) => {}),
      remoteLogger: {
        log: jest.fn(async (message) => {})
      }
    },
    pkg: {},
    inProduction: false,
    ...fakeDeps
  }
  return {
    logger: async (level, message) => loggerFactory(level, message, mergedFakeDeps),
    mergedFakeDeps
  }
}

describe('Checking parameters', () => {
  it('logs a string if \'message\' is an array', async () => {
    const { logger, mergedFakeDeps } = createLogger()
    await logger('info', ['array', 123])
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('array - 123')
  })

  it('logs a string if \'message\' is a string', async () => {
    const { logger, mergedFakeDeps } = createLogger()
    await logger('info', 'string message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('string message')
  })

  it('logs a string if \'message\' is an int', async () => {
    const { logger, mergedFakeDeps } = createLogger()
    await logger('info', 123)
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('123')
  })

  it('logs a string if \'message\' is undefined', async () => {
    const { logger, mergedFakeDeps } = createLogger()
    await logger('info', 123)
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toBeString()
  })

  it('logs a string if \'message\' is an object', async () => {
    const { logger, mergedFakeDeps } = createLogger()
    await logger('info', { myKey: 'thisValue', my2ndKey: 'otherValue' })
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('{"myKey":"thisValue","my2ndKey":"otherValue"}')
  })

  it('logs error stack if error given but no option', async () => {
    const { logger, mergedFakeDeps } = createLogger()
    await logger('info', [new Error('Fake error')])
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('Error: Fake error\n')
  })

  it('logs error message if error given and useMessage in option is set', async () => {
    const { logger, mergedFakeDeps } = createLogger()
    mergedFakeDeps.loggerOptions.error = {
      useMessage: true
    }
    await logger('info', [new Error('Fake error')])
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('Fake error')
  })
})

describe('Remote severity testing', () => {
  it('throws if remoteSeverity is undefined and not in production', async () => {
    const { logger } = createLogger({
      inProduction: false,
      logLevelMapper: logLevelMapper
    })
    await expect(() => logger('unknown', 'msg'))
      .rejects.toThrow()
    await expect(() => logger())
      .rejects.toThrow()
  })

  it('does not throw if remoteSeverity is undefined and is in production', async () => {
    const { logger } = createLogger({
      inProduction: true,
      logLevelMapper: logLevelMapper
    })
    await expect(() => logger('unknown', 'msg'))
      .resolved
    await expect(() => logger())
      .resolved
  })
})

describe('Prefix & suffix testing', () => {
  it('add an prefix if prefix is a string', async () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        prefix: 'testPrefix'
      }
    })
    await logger('info', 'message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('testPrefix')
  })

  it('add an suffix if suffix is a string', async () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        suffix: 'testSuffix'
      }
    })
    await logger('info', 'message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toContain('testSuffix')
  })

  it('checks if suffix is at the end of the message', async () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        suffix: 'testSuffix'
      }
    })
    await logger('info', 'message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toEndWith('message - testSuffix')
  })

  it('checks if prefix is at the start of the message', async () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        prefix: 'testPrefix'
      }
    })
    await logger('info', 'message')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toEndWith('testPrefix - message')
  })

  it('checks that format is \'prefix - message - suffix\'', async () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        prefix: 'testPrefix',
        suffix: 'testSuffix'
      }
    })
    await logger('info', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(localLogger).toEndWith('testPrefix - testMessage - testSuffix')
  })

  const objectArrayIntValues = [{ a: 123 }, [123, '456'], 123]
  objectArrayIntValues.forEach(value => {
    it(`throws if prefix is ${Array.isArray(value) ? 'array' : typeof value}`, async () => {
      const { logger } = createLogger({
        loggerOptions: {
          localLogger: () => {},
          prefix: value
        }
      })
      await expect(() => logger('info', 'message'))
        .rejects.toThrow()
    })
  })

  objectArrayIntValues.forEach(value => {
    it(`throws if suffix is ${Array.isArray(value) ? 'array' : typeof value}`, async () => {
      const { logger } = createLogger({
        loggerOptions: {
          localLogger: () => {},
          suffix: value
        }
      })
      await expect(() => logger('info', 'message'))
        .rejects.toThrow()
    })
  })
})

describe('Message level', () => {
  it('checks that level info is added and in upper case', async () => {
    const { logger, mergedFakeDeps } = createLogger()

    await logger('info', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(matchLogMessage(localLogger).level).toBe('INFO')
  })

  it('checks that level error is added and in upper case', async () => {
    const { logger, mergedFakeDeps } = createLogger()

    await logger('error', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(matchLogMessage(localLogger).level).toBe('ERROR')
  })
})

describe('Date and time', () => {
  it('adds the date and time at correct location', async () => {
    const { logger, mergedFakeDeps } = createLogger({
      formatDateTime: jest.fn((date) => ({ fDate: '00.00.0000', fTime: '00:00:00' }))
    })

    await logger('info', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(matchLogMessage(localLogger).dateTime).toBe('00.00.0000 00:00:00')
  })
  it('Checks that it adds the date and time at correct location, test 2', async () => {
    const { logger, mergedFakeDeps } = createLogger({
      formatDateTime: jest.fn((date) => ({ fDate: '12.03.4567', fTime: '12:34:56' }))
    })

    await logger('info', 'testMessage')
    const localLogger = mergedFakeDeps.loggerOptions.localLogger.mock.calls[0][0]

    expect(matchLogMessage(localLogger).dateTime).toBe('12.03.4567 12:34:56')
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
    it(`${testCase.shouldLog ? 'yes, ' : 'no,  '}if: inProduction = ${testCase.inProduction}, onlyInProd = ${testCase.onlyInProd}, logToRemote = ${testCase.logToRemote}`, async () => {
      const { logger, mergedFakeDeps } = createLogger({
        inProduction: testCase.inProduction,
        loggerOptions: {
          localLogger: () => {},
          remoteLogger: {
            log: jest.fn((message) => {})
          },
          onlyInProd: testCase.onlyInProd,
          logToRemote: testCase.logToRemote
        }
      })

      await logger('info', 'msg')

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
    { logToRemote: true, shouldLog: true, remoteLevel: 'info' },
    { logToRemote: true, shouldLog: true, remoteLevel: 'debug' },
    { logToRemote: true, shouldLog: false, remoteLevel: 'warn' },
    { logToRemote: false, shouldLog: false, remoteLevel: undefined },
    { logToRemote: false, shouldLog: false, remoteLevel: undefined },
    { logToRemote: false, shouldLog: false, remoteLevel: 'info' },
    { logToRemote: false, shouldLog: false, remoteLevel: 'warn' }
  ].forEach(testCase => {
    it(`should return ${testCase.shouldLog} when ${testCase.shouldLog ? '' : 'not '}logging to remote and remoteLevel is${testCase.remoteLevel ? ` ${testCase.remoteLevel}` : '\'nt specified'}`, async () => {
      const { logger } = createLogger({
        inProduction: true,
        loggerOptions: {
          localLogger: () => {},
          remoteLogger: {
            log: () => {}
          },
          logToRemote: testCase.logToRemote,
          remoteLevel: testCase.remoteLevel
        }
      })

      const loggedToRemote = await logger('info', 'msg')

      expect(loggedToRemote).toBe(testCase.shouldLog)
    })
  })
})

describe('Checking logging with Azure context', () => {
  it('appends invocationId to prefix', async () => {
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

    await logger('info', ['array', 123])

    const azure = mergedFakeDeps.loggerOptions.azure.log.info.mock.calls[0][0]
    console.log(azure)
    expect(azure).toMatch(new RegExp(`^${invocationId}`))
  })

  it('does not append invocationId to prefix if loggerOptions.azure.excludeInvocationId is true', async () => {
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

    await logger('info', ['array', 123])

    const azure = mergedFakeDeps.loggerOptions.azure.log.info.mock.calls[0][0]
    expect(azure).not.toMatch(new RegExp(`^${invocationId}`))
  })

  it('does not log to local', async () => {
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

    await logger('info', ['array', 123])
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
    it(`logs to context.logs.${test.toBeCalled} on ${test.level} level`, async () => {
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

      await logger(test.level, ['array', 123])

      const azure = mergedFakeDeps.loggerOptions.azure
      expect(azure.log[test.toBeCalled]).toHaveBeenCalled()
    })
  })
})

describe('Error handling', () => {
  it('catches errors from the remoteLogger function and logges it locally', async () => {
    const { logger, mergedFakeDeps } = createLogger({
      loggerOptions: {
        localLogger: jest.fn((message) => {}),
        remoteLogger: {
          log: jest.fn(async (message) => { throw Error('Test Error - R4nd0mC0d3') })
        },
        onlyInProd: false,
        logToRemote: true
      }
    })

    await expect(() => logger('info', ['array', 123]))
      .resolved

    const remoteLogger = mergedFakeDeps.loggerOptions.remoteLogger
    await expect(() => remoteLogger.log())
      .rejects.toThrow()
  })
})
