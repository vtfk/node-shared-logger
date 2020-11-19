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
  let logLevel = logLevelMapper(level)

  if (logLevel === undefined) {
    if (!inProduction) throw Error(`Unknown log level '${level}'`)
    level = 'warn'
    logLevel = logLevelMapper(level)
  }

  if (typeof loggerOptions.prefix === 'string') {
    messageArray.unshift(loggerOptions.prefix)
  } else if (loggerOptions.prefix && !inProduction) throw Error('logConfig({ --> prefix: ... <-- }) has to be of type string!')

  if (typeof loggerOptions.suffix === 'string') {
    messageArray.push(loggerOptions.suffix)
  } else if (loggerOptions.suffix && !inProduction) throw Error('logConfig({ --> suffix: ... <-- }) has to be of type string!')

  if (loggerOptions.azure && loggerOptions.azure.invocationId && loggerOptions.azure.excludeInvocationId !== true) {
    messageArray.unshift(loggerOptions.azure.invocationId)
  }

  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}: ` : ''
  messageArray = messageArray.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg)
  const logMessage = `${funcDetails}${messageArray.join(' - ')}`
  const remoteLogMessage = `${logLevel.level} - ${logMessage}`
  const localLogMessage = `[ ${fDate} ${fTime} ] < ${logLevel.level} >${logLevel.padding} ${logMessage}`

  const shouldLogToRemote = (loggerOptions.logToRemote && !(!inProduction && loggerOptions.onlyInProd)) || false
  if (shouldLogToRemote) loggerOptions.remoteLogger.log(remoteLogMessage, { severity: logLevel.severity })

  if (loggerOptions.azure && loggerOptions.azure.log) {
    const log = loggerOptions.azure.log
    log[logLevel.azureLevel](logMessage)
  } else {
    loggerOptions.localLogger(localLogMessage)
  }

  return shouldLogToRemote
}

module.exports = _loggerFactory
