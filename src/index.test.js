let index = require('./index')

describe('Checking for errors in index', () => {
  it('returns an object', () => {
    expect(index).toBeObject()
  })

  it('returns an object containing the logConfig function', () => {
    expect(index.logConfig).toBeFunction()
  })

  it('returns an object containing the logger function', () => {
    expect(index.logger).toBeFunction()
  })
})

describe('Testing returned functions', () => {
  it('calls logConfig() without an error', () => {
    expect(() => index.logConfig()).not.toThrow()
  })

  it('calls logger() without an error', () => {
    expect(() => index.logger('info', ['test', 'message'])).not.toThrow()
  })

  it('does not log to remote with no config', () => {
    expect(index.logger('info', ['test', 'message'])).toBe(false)
  })

  it('logs to remote with only env variables', () => {
    const oldEnvs = process.env
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
      PAPERTRAIL_HOST: 'env.example.com',
      PAPERTRAIL_PORT: '8081',
      PAPERTRAIL_HOSTNAME: 'envApp',
      PAPERTRAIL_APPNAME: 'testApp'
    }
    // Make sure it uses these env variables
    jest.resetModules()
    index = require('./index')

    expect(index.logger('info', ['test', 'message'])).toBe(true)
    process.env = oldEnvs

    jest.resetModules()
    index = require('./index')
  })

  it('does not log to remote if NODE_ENV !== produciton', () => {
    const oldEnvs = process.env
    process.env = {
      ...process.env,
      NODE_ENV: 'dev',
      PAPERTRAIL_HOST: 'env.example.com',
      PAPERTRAIL_PORT: '8081',
      PAPERTRAIL_HOSTNAME: 'envApp',
      PAPERTRAIL_APPNAME: 'testApp'
    }
    // Make sure it uses these env variables
    jest.resetModules()
    index = require('./index')

    expect(index.logger('info', ['test', 'message'])).toBe(false)
    process.env = oldEnvs

    jest.resetModules()
    index = require('./index')
  })

  it('does not log to remote if NODE_ENV is undefined', () => {
    const oldEnvs = process.env
    process.env = {
      ...process.env,
      PAPERTRAIL_HOST: 'env.example.com',
      PAPERTRAIL_PORT: '8081',
      PAPERTRAIL_HOSTNAME: 'envApp',
      PAPERTRAIL_APPNAME: 'testApp'
    }
    // Make sure it uses these env variables
    jest.resetModules()
    index = require('./index')

    expect(index.logger('info', ['test', 'message'])).toBe(false)
    process.env = oldEnvs

    jest.resetModules()
    index = require('./index')
  })
})
