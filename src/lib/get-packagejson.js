const packPath = require('packpath').parent()
const { join } = require('path')


module.exports = () => {
  try {
    return require(join(packPath, 'package.json'))
  } catch (error) {
    return
  }  
}
