function _loggerFactory (level, message,
  {
    formatDateTime,
    logLevelMapper,
    loggerOptions,
    pkg,
    inProduction
  }) {
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

  messageArray = messageArray.map(msg => typeof msg === 'object' ? JSON.stringify(msg) : msg)
  const messageFormats = formatLogMessage(formatDateTime, pkg, logLevel, messageArray)

  const shouldLogToRemote = (loggerOptions.logToRemote && !(!inProduction && loggerOptions.onlyInProd)) || false
  if (shouldLogToRemote) {
    const timeout = setTimeout(() => {
      loggerOptions.remoteLogger.close()
      const warnLevel = logLevelMapper('warn')
      const errorMessage = formatLogMessage(formatDateTime, pkg, warnLevel, ['logger-factory', 'logToRemote', 'error', 'remote logger timed out'])
      localLog(loggerOptions, warnLevel, errorMessage)
    }, loggerOptions.remoteTimeout)

    loggerOptions.remoteLogger.log(messageFormats.remoteLogMessage, { severity: logLevel.severity }, error => {
      if (error) {
        loggerOptions.remoteLogger.close()
        const warnLevel = logLevelMapper('warn')
        const errorMessage = formatLogMessage(formatDateTime, pkg, warnLevel, ['logger-factory', 'logToRemote', 'error', error.message])
        localLog(loggerOptions, warnLevel, errorMessage)
      }
      clearTimeout(timeout)
    })
  }

  localLog(loggerOptions, logLevel, messageFormats)

  return shouldLogToRemote
}

function formatLogMessage (formatDateTime, pkg, logLevel, messageArray) {
  const { fDate, fTime } = formatDateTime(new Date())
  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}: ` : ''
  const logMessage = `${funcDetails}${messageArray.join(' - ')}`
  return {
    logMessage,
    remoteLogMessage: `${logLevel.level} - ${logMessage}`,
    localLogMessage: `[ ${fDate} ${fTime} ] < ${logLevel.level} >${logLevel.padding} ${logMessage}`
  }
}

function localLog (loggerOptions, logLevel, messageFormats) {
  if (loggerOptions.azure && loggerOptions.azure.log) {
    const log = loggerOptions.azure.log
    log[logLevel.azureLevel](messageFormats.logMessage)
  } else {
    loggerOptions.localLogger(messageFormats.localLogMessage)
  }
}

module.exports = _loggerFactory
