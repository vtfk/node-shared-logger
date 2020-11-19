const deepmerge = require('deepmerge')
const logConfigFactory = require('./log-config-factory')

function createLogConfig (fakeDeps, options) {
  const mergedFakeDeps = {
    syslog: {
      createClient: jest.fn((host, options) => ({})),
      Transport: {
        Udp: 'udp'
      }
    },
    deepmerge,
    loggerOptions: {},
    envVariables: {},
    ...fakeDeps
  }

  const logConfig = (options) => logConfigFactory(options, mergedFakeDeps)

  logConfig(options)
  return {
    fakeDeps: mergedFakeDeps,
    logConfig
  }
}

describe('Checking client creation', () => {
  it('does not create a client on empty options', () => {
    const { fakeDeps } = createLogConfig()
    expect(fakeDeps.loggerOptions.remoteLogger).toBeUndefined()
  })

  it('was passed the correct options', () => {
    const { fakeDeps } = createLogConfig({}, {
      remote: {
        host: 'example.com',
        port: '8080',
        serviceHostname: 'myApp'
      }
    })

    const logConfigStats = fakeDeps.syslog.createClient.mock.calls[0]
    expect(logConfigStats[0]).toBe('example.com')
    expect(logConfigStats[1]).toMatchObject({
      port: '8080',
      syslogHostname: 'myApp',
      appName: 'default:',
      transport: 'udp',
      rfc3164: false
    })
    expect(fakeDeps.loggerOptions.logToRemote).toBeTruthy()
  })

  it('sets logToRemote as false on wrong config', () => {
    const { fakeDeps } = createLogConfig({}, {
      remote: {
        host: 'example.com',
        port: '8080',
        serviceHostname: 123
      }
    })

    expect(fakeDeps.loggerOptions.logToRemote).toBeFalsy()
  })

  it('sets prefix if defined', () => {
    const { fakeDeps } = createLogConfig({}, {
      prefix: 'my-prefix'
    })

    expect(fakeDeps.loggerOptions.prefix).toBe('my-prefix')
  })

  it('sets suffix if defined', () => {
    const { fakeDeps } = createLogConfig({}, {
      suffix: 'my-suffix'
    })

    expect(fakeDeps.loggerOptions.suffix).toBe('my-suffix')
  })

  it('assings localLogger to options if function', () => {
    const { fakeDeps } = createLogConfig({}, {
      localLogger: () => {}
    })

    expect(fakeDeps.loggerOptions.localLogger).toBeFunction()
  })

  it('does not assing localLogger to options if not a function', () => {
    const { fakeDeps } = createLogConfig({}, {
      localLogger: 'not a function'
    })

    expect(fakeDeps.loggerOptions.localLogger).toBeUndefined()
  })

  it('uses env variables if remote is not defined', () => {
    const { fakeDeps } = createLogConfig({
      envVariables: {
        PAPERTRAIL_HOST: 'env.example.com',
        PAPERTRAIL_PORT: '8081',
        PAPERTRAIL_HOSTNAME: 'envApp',
        PAPERTRAIL_APPNAME: 'testApp'
      }
    }, {})

    const logConfigStats = fakeDeps.syslog.createClient.mock.calls[0]
    expect(logConfigStats[0]).toBe('env.example.com')
    expect(logConfigStats[1]).toMatchObject({
      port: '8081',
      syslogHostname: 'envApp',
      appName: 'testApp',
      transport: 'udp',
      rfc3164: false
    })
  })

  it('uses remote if both env variables and remote is defined', () => {
    const { fakeDeps } = createLogConfig({
      envVariables: {
        PAPERTRAIL_HOST: 'env.example.com',
        PAPERTRAIL_PORT: '8081',
        PAPERTRAIL_HOSTNAME: 'envApp',
        PAPERTRAIL_APPNAME: 'testApp'
      }
    }, {
      remote: {
        host: 'example.com',
        port: '8080',
        serviceHostname: 'myApp'
      }
    })

    const logConfigStats = fakeDeps.syslog.createClient.mock.calls[0]
    expect(logConfigStats[0]).toBe('example.com')
    expect(logConfigStats[1]).toMatchObject({
      port: '8080',
      syslogHostname: 'myApp',
      appName: 'testApp',
      transport: 'udp',
      rfc3164: false
    })
  })

  it('uses remote if both env variables and remote is defined, no remote.host', () => {
    const { fakeDeps } = createLogConfig({
      envVariables: {
        PAPERTRAIL_HOST: 'env.example.com',
        PAPERTRAIL_PORT: '8081',
        PAPERTRAIL_HOSTNAME: 'envApp',
        PAPERTRAIL_APPNAME: 'testApp'
      }
    }, {
      remote: {
        port: '8080',
        serviceHostname: 'myApp'
      }
    })

    const logConfigStats = fakeDeps.syslog.createClient.mock.calls[0]
    expect(logConfigStats[0]).toBe('env.example.com')
    expect(logConfigStats[1]).toMatchObject({
      port: '8080',
      syslogHostname: 'myApp',
      appName: 'testApp',
      transport: 'udp',
      rfc3164: false
    })
  })

  it('uses remote if both env variables and remote is defined, no remote.port', () => {
    const { fakeDeps } = createLogConfig({
      envVariables: {
        PAPERTRAIL_HOST: 'env.example.com',
        PAPERTRAIL_PORT: '8081',
        PAPERTRAIL_HOSTNAME: 'envApp',
        PAPERTRAIL_APPNAME: 'testApp'
      }
    }, {
      remote: {
        host: 'example.com',
        serviceHostname: 'myApp'
      }
    })

    const logConfigStats = fakeDeps.syslog.createClient.mock.calls[0]
    expect(logConfigStats[0]).toBe('example.com')
    expect(logConfigStats[1]).toMatchObject({
      port: '8081',
      syslogHostname: 'myApp',
      appName: 'testApp',
      transport: 'udp',
      rfc3164: false
    })
  })

  it('uses remote if both env variables and remote is defined, no remote.serviceHostname', () => {
    const { fakeDeps } = createLogConfig({
      envVariables: {
        PAPERTRAIL_HOST: 'env.example.com',
        PAPERTRAIL_PORT: '8081',
        PAPERTRAIL_HOSTNAME: 'envApp',
        PAPERTRAIL_APPNAME: 'testApp'
      }
    }, {
      remote: {
        host: 'example.com',
        port: '8080'
      }
    })

    const logConfigStats = fakeDeps.syslog.createClient.mock.calls[0]
    expect(logConfigStats[0]).toBe('example.com')
    expect(logConfigStats[1]).toMatchObject({
      port: '8080',
      syslogHostname: 'envApp',
      appName: 'testApp',
      transport: 'udp',
      rfc3164: false
    })
  })

  it('supports setting one property of the config', () => {
    const { fakeDeps, logConfig } = createLogConfig({}, {
      prefix: 'kittens',
      suffix: 'cats',
      remote: {
        host: 'example.com',
        port: '8080',
        serviceHostname: 'myApp'
      }
    })
    expect(fakeDeps.loggerOptions.prefix).toBe('kittens')
    expect(fakeDeps.loggerOptions.suffix).toBe('cats')
    expect(fakeDeps.loggerOptions.remoteLogger).not.toBeUndefined()

    logConfig({
      prefix: 'very cute kittens'
    })
    expect(fakeDeps.loggerOptions.prefix).toBe('very cute kittens')
    expect(fakeDeps.loggerOptions.suffix).toBe('cats')
    expect(fakeDeps.loggerOptions.remoteLogger).not.toBeUndefined()
  })

  it('supports creating remote logger after initial config is set', () => {
    const { fakeDeps, logConfig } = createLogConfig({}, {
      prefix: 'kittens',
      suffix: 'cats'
    })
    expect(fakeDeps.loggerOptions.prefix).toBe('kittens')
    expect(fakeDeps.loggerOptions.suffix).toBe('cats')
    expect(fakeDeps.loggerOptions.remoteLogger).toBeUndefined()

    logConfig({
      prefix: 'very cute kittens',
      remote: {
        host: 'example.com',
        port: '8080',
        serviceHostname: 'myApp'
      }
    })
    expect(fakeDeps.loggerOptions.prefix).toBe('very cute kittens')
    expect(fakeDeps.loggerOptions.suffix).toBe('cats')
    expect(fakeDeps.loggerOptions.remoteLogger).not.toBeUndefined()
  })
})

function createAzureMock (id = '02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4', includeLoggers = ['error', 'warn', 'info', 'verbose']) {
  const context = {
    invocationId: id,
    log: {}
  }
  includeLoggers.forEach(logger => context.log[logger] = jest.fn((host, options) => ({})))
  return { context }
}

describe('Checking usage of Azure context', () => {
  it('adds invocationId to loggerOptions.azure.invocationId', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4')
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: { context }
    })
    expect(fakeDeps.loggerOptions.azure.invocationId).toBe('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4')
  })

  it('does not add invocationId to loggerOptions.azure.invocationId if invocationId is not a string', () => {
    const { context } = createAzureMock(122305123)
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: { context }
    })
    expect(fakeDeps.loggerOptions.azure.invocationId).not.toBe(122305123)
  })

  it('does not add the Azure logger functions to loggerOptions.azure.log[level] if error is missing', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4', ['warn', 'info', 'verbose'])
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: { context }
    })
    expect(fakeDeps.loggerOptions.azure.log).toBeUndefined()
  })

  it('does not add the Azure logger functions to loggerOptions.azure.log[level] if warn is missing', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4', ['error', 'info', 'verbose'])
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: { context }
    })
    expect(fakeDeps.loggerOptions.azure.log).toBeUndefined()
  })

  it('does not add the Azure logger functions to loggerOptions.azure.log[level] if info is missing', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4', ['error', 'warn', 'verbose'])
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: { context }
    })
    expect(fakeDeps.loggerOptions.azure.log).toBeUndefined()
  })

  it('does not add the Azure logger functions to loggerOptions.azure.log[level] if verbose is missing', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4', ['error', 'warn', 'info'])
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: { context }
    })
    expect(fakeDeps.loggerOptions.azure.log).toBeUndefined()
  })

  it('adds the Azure logger functions to loggerOptions.azure.log[level]', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4')
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: { context }
    })
    expect(fakeDeps.loggerOptions.azure.log.error).toBeFunction()
    expect(fakeDeps.loggerOptions.azure.log.warn).toBeFunction()
    expect(fakeDeps.loggerOptions.azure.log.info).toBeFunction()
    expect(fakeDeps.loggerOptions.azure.log.verbose).toBeFunction()
  })

  it('adds excludeInvocationId loggerOptions.azure.excludeInvocationId', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4')
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: {
        context,
        excludeInvocationId: true
      }
    })
    expect(fakeDeps.loggerOptions.azure.excludeInvocationId).toBe(true)
  })

  it('does not add loggerOptions.azure.excludeInvocationId if undefined', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4')
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: {
        context
      }
    })
    expect(fakeDeps.loggerOptions.azure.excludeInvocationId).toBeUndefined()
  })

  it('does not add loggerOptions.azure.excludeInvocationId if false', () => {
    const { context } = createAzureMock('02sd1514-c4dc-4c3a-ae9f-0066bb1da3a4')
    const { fakeDeps, logConfig } = createLogConfig({})
    logConfig({
      azure: {
        context,
        excludeInvocationId: false
      }
    })
    expect(fakeDeps.loggerOptions.azure.excludeInvocationId).toBeUndefined()
  })
})
