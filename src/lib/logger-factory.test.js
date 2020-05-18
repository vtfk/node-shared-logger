const loggerFactory = require('./logger-factory')

function createLogger (fakeDeps) {
  const mergedFakeDeps = {
    formatDateTime: jest.fn((date) => ({ fDate: '00/0/0000', fTime: '00:00:00' })),
    logLevelMapper: jest.fn((level) => 2),
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
      logLevelMapper: level => undefined
    })
    expect(() => logger('unknown', 'msg')).toThrow()
    expect(() => logger()).toThrow()
  })

  it('does not throw if syslogSeverity is undefined and is in production', () => {
    const { logger } = createLogger({
      inProduction: true,
      logLevelMapper: level => undefined
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