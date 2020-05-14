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

function getPkg () { return _getPkgFactory(getPkgDeps) }

module.exports = {
  pkg: getPkg(),
  _getPkgFactory
}
