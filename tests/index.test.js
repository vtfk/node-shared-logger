const matchers = require('jest-extended')
let index = require('../src/index')

expect.extend(matchers)

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

  it('does not log to remote with no config', async () => {
    expect(await index.logger('info', ['test', 'message'])).toBe(false)
  })

  it('logs to remote with only env variables', async () => {
    const oldEnvs = process.env
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
      PAPERTRAIL_HOST: 'env.example.com',
      PAPERTRAIL_TOKEN: '4567890'
    }
    // Make sure it uses these env variables and a mocked axios
    jest.resetModules()
    jest.mock('axios')
    index = require('../src/index')

    expect(await index.logger('info', ['test', 'message'])).toBe(true)
    process.env = oldEnvs

    jest.resetModules()
    index = require('../src/index')
  })

  it('does not log to remote if NODE_ENV !== produciton', async () => {
    const oldEnvs = process.env
    process.env = {
      ...process.env,
      NODE_ENV: 'dev',
      PAPERTRAIL_HOST: 'env.example.com',
      PAPERTRAIL_TOKEN: '4567890'
    }
    // Make sure it uses these env variables and a mocked axios
    jest.resetModules()
    jest.mock('axios')
    index = require('../src/index')

    expect(await index.logger('info', ['test', 'message'])).toBe(false)
    process.env = oldEnvs

    jest.resetModules()
    index = require('../src/index')
  })

  it('does not log to remote if NODE_ENV is undefined', async () => {
    const oldEnvs = process.env
    process.env = {
      ...process.env,
      PAPERTRAIL_HOST: 'env.example.com',
      PAPERTRAIL_TOKEN: '4567890'
    }
    // Make sure it uses these env variables and a mocked axios
    jest.resetModules()
    jest.mock('axios')
    index = require('../src/index')

    expect(await index.logger('info', ['test', 'message'])).toBe(false)
    process.env = oldEnvs

    jest.resetModules()
    index = require('../src/index')
  })
})
