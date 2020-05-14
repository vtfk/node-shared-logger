/* eslint-env jest */
const levelMapper = require('./log-level-mapper')

describe('Checking if it returns correct value based on level', () => {
  const levels = [
    { string: 'error', int: 0 },
    { string: 'warn', int: 1 },
    { string: 'info', int: 2 },
    { string: 'verbose', int: 3 },
    { string: 'debug', int: 4 },
    { string: 'silly', int: 5 },
    { string: 'Error', int: 0 },
    { string: 'WARN', int: 1 }
  ]
  levels.forEach(level => {
    it(`returns '${level.int}' when given string '${level.string}'`, () => {
      expect(levelMapper(level.string)).toBe(level.int)
    })
  })

  it('returns \'undefined\' for wrong string', () => {
    expect(levelMapper('randomString')).not.toBeDefined()
  })

  it('returns \'undefined\' for empty string', () => {
    expect(levelMapper('')).not.toBeDefined()
  })

  it('returns \'undefined\' for int', () => {
    expect(levelMapper(123)).not.toBeDefined()
  })

  it('returns \'undefined\' for undefined', () => {
    expect(levelMapper(undefined)).not.toBeDefined()
  })

  it('returns \'undefined\' for null', () => {
    expect(levelMapper(null)).not.toBeDefined()
  })
})
