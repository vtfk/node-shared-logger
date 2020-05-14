function _inProductionFactory (nodeEnv) {
  return nodeEnv === 'production'
}

module.exports = {
  inProduction: _inProductionFactory(process.env.NODE_ENV),
  _inProductionFactory
}
