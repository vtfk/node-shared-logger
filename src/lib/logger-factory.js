function _loggerFactory (level, message,
  {
    formatDateTime,
    logLevelMapper,
    loggerOptions,
    pkg,
    inProduction
  }) {
  const { fDate, fTime } = formatDateTime(new Date())
  let messageArray = Array.isArray(message) ? message : [message]
  let syslogSeverity = logLevelMapper(level)

  if (syslogSeverity === undefined) {
    if (!inProduction) throw Error(`Unknown log level '${level}'`)
    level = 'warn'
    syslogSeverity = logLevelMapper(level)
  }

  if (typeof loggerOptions.prefix === 'string') {
    messageArray.unshift(loggerOptions.prefix)
  } else if (loggerOptions.prefix && !inProduction) throw Error('logConfig({ --> prefix: ... <-- }) has to be of type string!')

  if (typeof loggerOptions.suffix === 'string') {
    messageArray.push(loggerOptions.suffix)
  } else if (loggerOptions.suffix && !inProduction) throw Error('logConfig({ --> suffix: ... <-- }) has to be of type string!')

  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}: ` : ''
  messageArray = messageArray.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg)
  const logMessage = `${funcDetails}${messageArray.join(' - ')}`
  const remoteLogMessage = `${level.toUpperCase()} - ${logMessage}`
  const localLogMessage = `[ ${fDate} ${fTime} ] < ${level.toUpperCase()} > ${logMessage}`

  const shouldLogToRemote = loggerOptions.logToRemote && !(!inProduction && loggerOptions.onlyInProd)
  if (shouldLogToRemote) loggerOptions.remoteLogger.log(remoteLogMessage, { severity: syslogSeverity })

  loggerOptions.localLogger(localLogMessage)
}

module.exports = _loggerFactory
