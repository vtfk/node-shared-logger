const { pkg, _getPkgFactory } = require('./get-package-json')

describe('Testing root package.json path', () => {
  it('correct types', () => {
    expect(pkg).toBeDefined()
    expect(pkg.version).toBeString()
    expect(pkg.name).toBeString()
  })
  it('returns undefined if bad path', () => {
    const badPkg = _getPkgFactory({ join: () => 'badPath', packPath: '' })
    expect(badPkg).not.toBeDefined()
  })
})
