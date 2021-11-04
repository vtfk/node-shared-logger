const matchers = require('jest-extended')
const { pkg } = require('../../src/lib/get-package-json')

expect.extend(matchers)

describe('Testing root package.json path', () => {
  it('correct types', () => {
    expect(pkg).toBeDefined()
    expect(pkg.version).toBeString()
    expect(pkg.name).toBeString()
  })
})
