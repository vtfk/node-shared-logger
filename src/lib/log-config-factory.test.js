const logConfigFactory = require('./log-config-factory')

describe('Checking client creation', () => {
  const fakeDeps = {
    syslog: {
      createClient: jest.fn((host, options) => ({})),
      Transport: {
        Udp: 'udp'
      }
    },
    loggerOptions: {},
    inProduction: true
  }

  const logConfig = (options) => logConfigFactory(options, fakeDeps)

  logConfig({
    remote: {
      host: 'example.com',
      port: '8080',
      serviceHostname: 'myApp'
    }
  })

  it('creates a client', () => {
    expect(fakeDeps.loggerOptions.remoteLogger).toBeObject()
  })

  it('was passed the correct options', () => {
    expect(fakeDeps.syslog.createClient.mock.calls[0][0]).toBe('example.com')
    expect(fakeDeps.syslog.createClient.mock.calls[0][1].port).toBe('8080')
    expect(fakeDeps.syslog.createClient.mock.calls[0][1].syslogHostname).toBe('myApp')
    expect(fakeDeps.syslog.createClient.mock.calls[0][1].appName).toBe('default:')
    expect(fakeDeps.syslog.createClient.mock.calls[0][1].transport).toBe('udp')
    expect(fakeDeps.syslog.createClient.mock.calls[0][1].rfc3164).toBe(false)
  })
})
