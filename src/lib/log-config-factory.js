function _logConfigFactory (options = {},
  {
    syslog,
    loggerOptions,
    inProduction
  }) {
  if (
    options && typeof options === 'object' &&
    options.remote && typeof options.remote === 'object'
  ) {
    options.remote.host = options.remote.host || process.env.PAPERTRAIL_HOST
    options.remote.port = options.remote.port || process.env.PAPERTRAIL_PORT
    options.remote.serviceHostname = options.remote.serviceHostname || process.env.PAPERTRAIL_HOSTNAME
    options.remote.serviceAppname = options.remote.serviceAppname || process.env.PAPERTRAIL_APPNAME || 'default:'

    loggerOptions.remoteLogger = syslog.createClient(options.remote.host, {
      port: options.remote.port,
      syslogHostname: options.remote.hostname,
      appName: options.remote.serviceAppname,
      transport: syslog.Transport.Udp,
      rfc3164: false // Use RFC5424
    })

    // onlyInProd defaults to true
    options.remote.onlyInProd = options.remote.onlyInProd === undefined

    if (!(inProduction && options.remote.onlyInProd)) {
      loggerOptions.enabled = true
    }
  }

  loggerOptions.prefix = typeof options.prefix === 'string' ? options.prefix : undefined
  loggerOptions.suffix = typeof options.suffix === 'string' ? options.suffix : undefined

  if (typeof options.localLogger === 'function') {
    loggerOptions.localLogger = options.localLogger
  }
}

module.exports = _logConfigFactory
