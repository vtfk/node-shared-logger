const pkgDir = require('pkg-dir')
const { join } = require('path')

const getPkgDeps = {
  pkgDir,
  join
}
console.log(pkgDir.sync())
function _getPkgFactory (
  {
    pkgDir,
    join
  }) {
  try {
    return require(join(pkgDir.sync(), 'package.json'))
  } catch (error) {
    return undefined
  }
}

module.exports = {
  pkg: _getPkgFactory(getPkgDeps),
  _getPkgFactory
}
