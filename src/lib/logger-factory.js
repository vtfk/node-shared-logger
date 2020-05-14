function _loggerFactory (level, message,
  {
    formatDateTime,
    logLevelMapper,
    loggerOptions,
    pkg,
    inProduction
  }) {
  const { fDate, fTime } = formatDateTime(new Date())
  const messageArray = Array.isArray(message) ? message : [message]
  let syslogSeverity = logLevelMapper(level)

  if (syslogSeverity === undefined) {
    if (inProduction) throw Error(`Unknown log level '${level}'`)
    level = 'warn'
    syslogSeverity = logLevelMapper(level)
  }

  loggerOptions.prefix && messageArray.unshift(loggerOptions.prefix)
  loggerOptions.suffix && messageArray.push(loggerOptions.suffix)

  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}: ` : ''
  const logMessage = `${funcDetails}${messageArray.join(' - ')}`
  const remoteLogMessage = `${level.toUpperCase()} - ${logMessage}`
  const localLogMessage = `[ ${fDate} ${fTime} ] < ${level.toUpperCase()} > ${logMessage}`

  if (loggerOptions.enabled) loggerOptions.remoteLogger.log(remoteLogMessage, { severity: syslogSeverity })

  loggerOptions.localLogger(localLogMessage)
}

module.exports = _loggerFactory
