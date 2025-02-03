const getMessage = require('./get-message')

async function _loggerFactory (level, message, { formatDateTime, logLevelMapper, loggerOptions, pkg, inProduction }, context) {
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
  const messageFormats = formatLogMessage(formatDateTime, pkg, logLevel, messageArray, context)
  const remoteLevel = (loggerOptions.remoteLevel && logLevelMapper(loggerOptions.remoteLevel)) || undefined
  const remoteLevelLogToRemote = remoteLevel ? logLevel.severity <= remoteLevel.severity : true
  const betterstackLevel = (loggerOptions.betterstackLevel && logLevelMapper(loggerOptions.betterstackLevel)) || undefined
  const betterstackLevelLogToBetterstack = betterstackLevel ? logLevel.severity <= betterstackLevel.severity : true
  const teamsLevel = (loggerOptions.teamsLevel && logLevelMapper(loggerOptions.teamsLevel)) || undefined
  const remoteLevelLogToTeams = teamsLevel ? logLevel.severity <= teamsLevel.severity : true

  // Local logging (when no context override)
  if (!(context && context.log)) localLog(loggerOptions, logLevel, messageFormats)

  // Remote logging
  const shouldLogToRemote = (loggerOptions.logToRemote && !(!inProduction && loggerOptions.onlyInProd) && remoteLevelLogToRemote) || false
  try {
    if (shouldLogToRemote) await loggerOptions.remoteLogger.log(messageFormats.remoteLogMessage)
  } catch (error) {
    const warnLevel = logLevelMapper('warn')
    const errorMessage = formatLogMessage(formatDateTime, pkg, warnLevel, ['logger-factory', 'logToRemote', 'error', error.message])
    localLog(loggerOptions, warnLevel, errorMessage)
  }

  // Betterstack logging
  const shouldLogToBetterstack = (loggerOptions.logToBetterstack && !(!inProduction && loggerOptions.onlyInProd) && betterstackLevelLogToBetterstack) || false
  try {
    if (shouldLogToBetterstack) await loggerOptions.betterstackLogger.log(logLevel.level.toLowerCase(), messageFormats.betterstackLogMessage)
  } catch (error) {
    const warnLevel = logLevelMapper('warn')
    const errorMessage = formatLogMessage(formatDateTime, pkg, warnLevel, ['logger-factory', 'logToBetterstack', 'error', error.message])
    localLog(loggerOptions, warnLevel, errorMessage)
  }

  // Teams logging
  const shouldLogToTeams = (loggerOptions.logToTeams && !(!inProduction && loggerOptions.onlyTeamsInProd) && remoteLevelLogToTeams) || false
  try {
    if (shouldLogToTeams) await loggerOptions.teamsLogger.log({ messageCard: messageFormats.teamsMessageCard, adaptiveCard: messageFormats.teamsAdaptiveCard })
  } catch (error) {
    const warnLevel = logLevelMapper('warn')
    const errorMessage = formatLogMessage(formatDateTime, pkg, warnLevel, ['logger-factory', 'logToTeams', 'error', error.message])
    localLog(loggerOptions, warnLevel, errorMessage)
  }

  // Azure context logging
  if (context && context.log) {
    try {
      if (context.log[logLevel.azureLevel]) {
        context.log[logLevel.azureLevel](messageFormats.localLogMessage)
      } else if (context[logLevel.azureLevel]) {
        context[logLevel.azureLevel](messageFormats.localLogMessage) // v4 of Azure Functions have moved logLevel directly onto context
      } else {
        throw new Error('Context object does not contain expected function for loglevel')
      }
    } catch (error) {
      const warnLevel = logLevelMapper('warn')
      const errorMessage = formatLogMessage(formatDateTime, pkg, warnLevel, ['logger-factory', 'logToContext', 'error', error.message])
      localLog(loggerOptions, warnLevel, errorMessage)
    }
  }

  return shouldLogToRemote // This is only used for testing - the tests work exactly the same way for both logging to remote and to Teams, if you mess with one of them, you mess with both (the tests)!
}

function formatLogMessage (formatDateTime, pkg, logLevel, messageArray, context) {
  const { fDate, fTime } = formatDateTime(new Date())
  const invocationId = (context && context.log && context.invocationId) ? ` - ${context.invocationId}` : ''
  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}${invocationId}: ` : ''
  const logMessage = `${funcDetails}${messageArray.join(' - ')}`

  return {
    logMessage,
    remoteLogMessage: `${logLevel.level} - ${logMessage}`,
    betterstackLogMessage: logMessage, // Betterstack package will add level and timestamp
    localLogMessage: `[ ${fDate} ${fTime} ] < ${logLevel.level} >${logLevel.padding} ${logMessage}`,
    teamsMessageCard: formatMessageCard(logLevel, `${logLevel.level} - ${funcDetails}`, messageArray),
    teamsAdaptiveCard: formatAdaptiveCard(logLevel, `${logLevel.level} - ${funcDetails}`, messageArray)
  }
}

function formatMessageCard (logLevel, title, messageArray) {
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: title,
    themeColor: logLevel.teamsColor,
    title,
    sections: [
      {
        facts: messageArray.map(msg => {
          return { name: 'Msg:', value: msg }
        })
      }
    ]
  }
}

function formatAdaptiveCard (logLevel, title, messageArray) {
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.5',
          msteams: { width: 'full' },
          body: [
            {
              type: 'TextBlock',
              text: title,
              color: logLevel.adaptiveCardColor,
              weight: 'bolder',
              size: 'Large',
              wrap: true
            },
            ...(messageArray.map(msg => { return { type: 'TextBlock', text: `• ${msg}`, wrap: true } }))
          ]
        }
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
