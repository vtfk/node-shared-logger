const { _inProductionFactory } = require('./in-production')

describe('Checking if it returns correct value', () => {
  it('returns false when string is NOT \'production\'', () => {
    expect(_inProductionFactory(undefined)).toBe(false)
    expect(_inProductionFactory('anything')).toBe(false)
  })
  it('returns false when string is \'production\'', () => {
    expect(_inProductionFactory('production')).toBe(true)
  })
})
