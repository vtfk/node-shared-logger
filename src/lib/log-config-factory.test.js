const logConfigFactory = require('./log-config-factory')

function createLogConfig (fakeDeps, options) {
  const mergedFakeDeps = {
    syslog: {
      createClient: jest.fn((host, options) => ({})),
      Transport: {
        Udp: 'udp'
      }
    },
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
})
