const pkgDir = require('pkg-dir')
const { join } = require('path')

module.exports = {
  pkg: require(join(pkgDir.sync(), 'package.json'))
}
