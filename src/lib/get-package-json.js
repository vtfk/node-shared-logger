const packPath = require('packpath').parent()
const { join } = require('path')

const getPkgDeps = {
  packPath,
  join
}

function _getPkgFactory (
  {
    packPath,
    join
  }) {
  try {
    return require(join(packPath, 'package.json'))
  } catch (error) {
    return undefined
  }
}

module.exports = {
  pkg: _getPkgFactory(getPkgDeps),
  _getPkgFactory
}
