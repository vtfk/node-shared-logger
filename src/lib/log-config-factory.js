function _logConfigFactory (options = {},
  {
    syslog,
    loggerOptions,
    envVariables
  }) {
  if (
    (!options || !options.remote) &&
    envVariables.PAPERTRAIL_HOST &&
    envVariables.PAPERTRAIL_PORT &&
    envVariables.PAPERTRAIL_HOSTNAME
  ) {
    options.remote = {
      host: envVariables.PAPERTRAIL_HOST,
      port: envVariables.PAPERTRAIL_PORT,
      serviceHostname: envVariables.PAPERTRAIL_HOSTNAME
    }
  }
  if (
    options && typeof options === 'object' &&
    options.remote && typeof options.remote === 'object'
  ) {
    options.remote.host = options.remote.host || envVariables.PAPERTRAIL_HOST
    options.remote.port = options.remote.port || envVariables.PAPERTRAIL_PORT
    options.remote.serviceHostname = options.remote.serviceHostname || envVariables.PAPERTRAIL_HOSTNAME
    options.remote.serviceAppname = options.remote.serviceAppname || envVariables.PAPERTRAIL_APPNAME || 'default:'

    loggerOptions.remoteLogger = syslog.createClient(options.remote.host, {
      port: options.remote.port,
      syslogHostname: options.remote.serviceHostname,
      appName: options.remote.serviceAppname,
      transport: syslog.Transport.Udp,
      rfc3164: false // Use RFC5424
    })

    // onlyInProd defaults to true
    options.remote.onlyInProd = options.remote.onlyInProd === undefined

    if (
      typeof options.remote.host === 'string' &&
      typeof options.remote.port === 'string' &&
      typeof options.remote.serviceHostname === 'string'
    ) {
      loggerOptions.logToRemote = true
    }
  }

  loggerOptions.prefix = typeof options.prefix === 'string' ? options.prefix : undefined
  loggerOptions.suffix = typeof options.suffix === 'string' ? options.suffix : undefined

  if (typeof options.localLogger === 'function') {
    loggerOptions.localLogger = options.localLogger
  }
}

module.exports = _logConfigFactory
