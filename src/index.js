const packPath = require('packpath').parent()
const { join } = require('path')
const syslog = require('syslog-client')
const logLevelMapper = require('./lib/log-level-mapper')
const getDateTime = require('./lib/get-date-time')

const pkg = require(join(packPath, 'package.json'))

// Store the options after configuration
const loggerOptions = {
  localLogger: console.log
}

/**
 * Logger configuration
 * @description Configure the logger and add message suffix/prefix
 * @param {object}    [options]                           Options for logging
 * @param {object}    [options.remote]                    Options for remote logging. If undefined; disables remote logging
 * @param {string}    [options.remote.onlyInProd=true]    If true; only log to remote aggregator when NODE_ENV === 'production'
 * @param {string}    [options.remote.host]               Hostname for the remote aggregator
 * @param {string}    [options.remote.port]               Port for the remote aggregator
 * @param {string}    [options.remote.serviceHostname]    The identificator of this service
 * @param {string}    [options.remote.serviceAppname="default:"]   The identificator of this application (defaults to "default:" for consistency with Winston)
 * @param {string}    [options.prefix]                    A string that will be added in front of each log message (ex. UID for each run)
 * @param {string}    [options.suffix]                    A string that will be added at the end of each log message
 * @param {function}  [options.localLogger=console.log]   Replace the local logger with a custom function (Default: console.log)
 * @returns {void}
 */
function logConfig (options = {}) {
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

    if (!(process.env.NODE_ENV !== 'production' && options.remote.onlyInProd)) {
      loggerOptions.enabled = true
    }
  }

  loggerOptions.prefix = typeof options.prefix === 'string' ? options.prefix : undefined
  loggerOptions.suffix = typeof options.suffix === 'string' ? options.suffix : undefined

  if (typeof options.localLogger === 'function') {
    loggerOptions.localLogger = options.localLogger
  }
}

/**
 * Logger function
 * @description This function will log a message with a level of severity
 * @param {string}          level     The severity of the message
 * @param {array<string>}   message   An array of strings which is joined by a hyphen in the log message
 * @returns {void}
 */
function logger (level, message) {
  const { fDate, fTime } = getDateTime()
  const messageArray = Array.isArray(message) ? message : [message]
  let syslogSeverity = logLevelMapper(level)

  if (syslogSeverity === undefined) {
    logger('error', ['Unknown log level', level, 'using \'warn\' level instead'])
    level = 'warn'
    syslogSeverity = logLevelMapper(level)
  }

  loggerOptions.prefix && messageArray.unshift(loggerOptions.prefix)
  loggerOptions.suffix && messageArray.push(loggerOptions.suffix)

  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}` : ''
  const logMessage = `${funcDetails}: ${messageArray.join(' - ')}`
  const remoteLogMessage = `${level.toUpperCase()} - ${logMessage}`
  const localLogMessage = `[ ${fDate} ${fTime} ] < ${level.toUpperCase()} >  ${logMessage}`

  if (loggerOptions.enabled) loggerOptions.remoteLogger.log(remoteLogMessage, { severity: syslogSeverity })

  loggerOptions.localLogger(localLogMessage)
}

module.exports = {
  logConfig,
  logger
}
