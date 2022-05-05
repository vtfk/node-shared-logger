const getMessage = require('./get-message')

async function _loggerFactory (level, message, { formatDateTime, logLevelMapper, loggerOptions, pkg, inProduction }) {
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

  if (typeof loggerOptions.error === 'object') {
    loggerOptions.error.property = loggerOptions.error.useMessage ? 'message' : 'stack'
  } else {
    loggerOptions.error = {
      property: 'stack'
    }
  }

  messageArray = messageArray.map(msg => getMessage(msg, loggerOptions.error.property))
  const messageFormats = formatLogMessage(formatDateTime, pkg, logLevel, messageArray)
  const remoteLevel = (loggerOptions.remoteLevel && logLevelMapper(loggerOptions.remoteLevel)) || undefined
  const remoteLevelLogToRemote = remoteLevel ? logLevel.severity <= remoteLevel.severity : true
  const teamsLevel = (loggerOptions.teamsLevel && logLevelMapper(loggerOptions.teamsLevel)) || undefined
  const remoteLevelLogToTeams = teamsLevel ? logLevel.severity <= teamsLevel.severity : true

  localLog(loggerOptions, logLevel, messageFormats)

  // Remote logging
  const shouldLogToRemote = (loggerOptions.logToRemote && !(!inProduction && loggerOptions.onlyInProd) && remoteLevelLogToRemote) || false
  try {
    if (shouldLogToRemote) await loggerOptions.remoteLogger.log(messageFormats.remoteLogMessage)
  } catch (error) {
    const warnLevel = logLevelMapper('warn')
    const errorMessage = formatLogMessage(formatDateTime, pkg, warnLevel, ['logger-factory', 'logToRemote', 'error', error.message])
    localLog(loggerOptions, warnLevel, errorMessage)
  }

  // Teams logging
  const shouldLogToTeams = (loggerOptions.logToTeams && !(!inProduction && loggerOptions.onlyTeamsInProd) && remoteLevelLogToTeams) || false
  try {
    if (shouldLogToTeams) await loggerOptions.teamsLogger.log(messageFormats.teamsAdaptiveCard)
  } catch (error) {
    const warnLevel = logLevelMapper('warn')
    const errorMessage = formatLogMessage(formatDateTime, pkg, warnLevel, ['logger-factory', 'logToTeams', 'error', error.message])
    localLog(loggerOptions, warnLevel, errorMessage)
  }

  return shouldLogToRemote // This is only used for testing - the tests work exactly the same way for both logging to remote and to Teams, if you mess with one of them, you mess with both (the tests)!
}

function formatLogMessage (formatDateTime, pkg, logLevel, messageArray) {
  const { fDate, fTime } = formatDateTime(new Date())
  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}: ` : ''
  const logMessage = `${funcDetails}${messageArray.join(' - ')}`

  return {
    logMessage,
    remoteLogMessage: `${logLevel.level} - ${logMessage}`,
    localLogMessage: `[ ${fDate} ${fTime} ] < ${logLevel.level} >${logLevel.padding} ${logMessage}`,
    teamsAdaptiveCard: formatAdaptiveCard(logLevel, `${logLevel.level} - ${funcDetails}`, messageArray)
  }
}

function formatAdaptiveCard (logLevel, title, messageArray) {
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: 'Denne vet jeg ikke hvor dukker opp, men microsoft MÅÅÅ ha den',
    themeColor: logLevel.teamsColor,
    title: title,
    sections: [
      {
        facts: messageArray.map(msg => {
          const name = msg.indexOf(':') > 0 ? msg.substring(0, msg.indexOf(':')).trim() : 'Msg'
          const value = msg.indexOf(':') > 0 ? msg.substring(msg.indexOf(':') + 1, msg.length).trim() : msg
          return { name, value }
        })
      }
    ]
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
