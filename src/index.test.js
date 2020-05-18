const index = require('./index')

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
})
