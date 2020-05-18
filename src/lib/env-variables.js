function _envVariablesFactory (envs) {
  return envs
}

module.exports = {
  envVariables: _envVariablesFactory(process.env),
  _envVariablesFactory
}
