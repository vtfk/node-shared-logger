function _logConfigFactory (options = {}, { axios, deepmerge, loggerOptions, envVariables }) {
  options = deepmerge(loggerOptions.previousOptions, options)
  loggerOptions.previousOptions = options
  if ((!options || !options.remote) && envVariables.PAPERTRAIL_HOST && envVariables.PAPERTRAIL_TOKEN) {
    options.remote = {
      host: envVariables.PAPERTRAIL_HOST,
      token: envVariables.PAPERTRAIL_TOKEN
    }
  }
  if (options && typeof options === 'object' && options.remote && typeof options.remote === 'object') {
    options.remote.host = options.remote.host || envVariables.PAPERTRAIL_HOST
    options.remote.token = options.remote.token || envVariables.PAPERTRAIL_TOKEN

    loggerOptions.remoteLogger = {
      log: msg => axios.post(options.remote.host, msg, { auth: { password: options.remote.token } })
    }

    // onlyInProd defaults to true
    loggerOptions.onlyInProd = options.remote.onlyInProd === undefined ? true : options.remote.onlyInProd
    options.remote.onlyInProd = loggerOptions.onlyInProd

    // enables remote logging if everything checks out, otherwise remote logging will be disabled
    loggerOptions.logToRemote = !options.remote.disabled &&
      typeof options.remote.host === 'string' &&
      typeof options.remote.token === 'string'
  }

  loggerOptions.error = typeof options.error === 'object' ? options.error : undefined
  loggerOptions.prefix = typeof options.prefix === 'string' ? options.prefix : undefined
  loggerOptions.suffix = typeof options.suffix === 'string' ? options.suffix : undefined

  if (typeof options.localLogger === 'function') {
    loggerOptions.localLogger = options.localLogger
  }

  if (typeof options.azure !== 'undefined' && typeof options.azure.context !== 'undefined') {
    loggerOptions.azure = {}

    if (typeof options.azure.context.invocationId === 'string') {
      loggerOptions.azure.invocationId = options.azure.context.invocationId
    }

    const log = options.azure.context.log
    if (log && log.error && log.warn && log.info && log.verbose) {
      loggerOptions.azure.log = log
    }

    if (options.azure.excludeInvocationId === true) {
      loggerOptions.azure.excludeInvocationId = options.azure.excludeInvocationId
    }
  }
}

module.exports = _logConfigFactory
