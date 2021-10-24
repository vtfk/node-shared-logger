function _logConfigFactory (options = {}, { syslog, deepmerge, loggerOptions, envVariables }) {
  options = deepmerge(loggerOptions.previousOptions, options)
  loggerOptions.previousOptions = options
  if ((!options || !options.remote) && envVariables.PAPERTRAIL_HOST && envVariables.PAPERTRAIL_PORT && envVariables.PAPERTRAIL_HOSTNAME) {
    options.remote = {
      host: envVariables.PAPERTRAIL_HOST,
      port: envVariables.PAPERTRAIL_PORT,
      serviceHostname: envVariables.PAPERTRAIL_HOSTNAME
    }
  }
  if (options && typeof options === 'object' && options.remote && typeof options.remote === 'object') {
    options.remote.host = options.remote.host || envVariables.PAPERTRAIL_HOST
    options.remote.port = options.remote.port || envVariables.PAPERTRAIL_PORT
    options.remote.serviceHostname = options.remote.serviceHostname || envVariables.PAPERTRAIL_HOSTNAME
    options.remote.serviceAppname = options.remote.serviceAppname || envVariables.PAPERTRAIL_APPNAME || 'default:'
    options.remote.protocol = options.remote.protocol || envVariables.PAPERTRAIL_PROTOCOL || 'tls4' // can be any of: tcp4, udp4, tls4, unix, unix-connect

    loggerOptions.remoteLogger = syslog.createLogger({
      format: syslog.format.printf(({ message }) => { // https://github.com/winstonjs/winston#formats
        return `${message}`
      }),
      levels: syslog.config.syslog.levels,
      transports: [
        new syslog.transports.Syslog({
          host: options.remote.host,
          port: options.remote.port,
          localhost: options.remote.serviceHostname,
          app_name: options.remote.serviceAppname,
          protocol: options.remote.protocol,
          eol: '\n'
        })
      ]
    })

    // onlyInProd defaults to true
    options.remote.onlyInProd = options.remote.onlyInProd === undefined

    // enables remote logging if everything checks out, otherwise remote logging will be disabled
    loggerOptions.logToRemote = !options.remote.disabled &&
      typeof options.remote.host === 'string' &&
      typeof options.remote.port === 'string' &&
      typeof options.remote.serviceHostname === 'string'
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
