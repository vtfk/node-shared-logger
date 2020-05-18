const { _envVariablesFactory } = require('./env-variables')

describe('Checking if it returns correct value', () => {
  it('returns the same values passed in', () => {
    expect(_envVariablesFactory({ NODE_ENV: 'production' })).toMatchObject({ NODE_ENV: 'production' })
  })
})
