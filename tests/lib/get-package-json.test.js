const { pkg } = require('../../src/lib/get-package-json')

describe('Testing root package.json path', () => {
  it('correct types', () => {
    expect(pkg).toBeDefined()
    expect(pkg.version).toBeString()
    expect(pkg.name).toBeString()
  })
})
