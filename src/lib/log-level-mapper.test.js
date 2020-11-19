const levelMapper = require('./log-level-mapper')

describe('Checking if it returns correct value based on level', () => {
  const levels = [
    { string: 'error', int: 0, message: 'ERROR', padding: '  ' },
    { string: 'warn', int: 1, message: 'WARN', padding: '   ' },
    { string: 'info', int: 2, message: 'INFO', padding: '   ' },
    { string: 'verbose', int: 3, message: 'VERBOSE', padding: '' },
    { string: 'debug', int: 4, message: 'DEBUG', padding: '  ' },
    { string: 'silly', int: 5, message: 'SILLY', padding: '  ' },
    { string: 'Error', int: 0, message: 'ERROR', padding: '  ' },
    { string: 'WARN', int: 1, message: 'WARN', padding: '   ' }
  ]
  levels.forEach(level => {
    it(`returns { level: ${level.int}, message: '${level.message}', padding: ${level.padding} } when given string '${level.string}'`, () => {
      expect(levelMapper(level.string).severity).toBe(level.int)
      expect(levelMapper(level.string).level).toBe(level.message)
      expect(levelMapper(level.string).padding).toBe(level.padding)
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

describe('Checking if it returns correct azureLevel', () => {
  const levels = [
    { string: 'error', azureLevel: 'error' },
    { string: 'warn', azureLevel: 'warn' },
    { string: 'info', azureLevel: 'info' },
    { string: 'verbose', azureLevel: 'verbose' },
    { string: 'debug', azureLevel: 'verbose' },
    { string: 'silly', azureLevel: 'verbose' },
    { string: 'INfo', azureLevel: 'info' },
    { string: 'SILLY', azureLevel: 'verbose' }
  ]
  levels.forEach(level => {
    it(`returns azureLevel: '${level.azureLevel}', when given string '${level.string}'`, () => {
      expect(levelMapper(level.string).azureLevel).toBe(level.azureLevel)
    })
  })
})
