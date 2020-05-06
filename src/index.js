const packPath = require('packpath').parent()
const { join } = require('path')
const syslog = require('syslog-client')
const logLevelMapper = require('./lib/log-level-mapper')

const pkg = require(join(packPath, 'package.json'))

// Store the options after configuration
let remoteLogger
const msgOpts = {}

/**
 * Logger configuration
 * @description Configure the logger for Papertrail and add message suffix/prefix
 * @param {object}  ptOpts           Options for Papertrail
 * @param {string}  ptOpts.disabled  If true; does not log to Papertrail
 * @param {string}  ptOpts.host      Hostname for the Papertrail server
 * @param {string}  ptOpts.port      Port for the Papertrail server
 * @param {string}  ptOpts.hostname  The name identifying name of the service (application / server)
 * @param {string}  prefix            A string that will be added in front of each log message (ex. UID for each run)
 * @param {string}  suffix            A string that will be added at the end of each log message
 * @returns {boolean}                 Returns true if logging to Papertrail
 */
function logConfig (ptOpts, prefix, suffix) {
  // TODO: Change to a single options parameter for easier management
  // TODO: New logic for checking if Papertrail should be enabled.
  if (ptOpts && typeof ptOpts !== 'object') logger('warn', ['Logger config', 'Wrong type on parameter "ptOpts <Object>"'])
  if (process.env.NODE_ENV !== 'production') ptOpts.disabled = true

  if (!ptOpts.disabled) {
    ptOpts.host = ptOpts.host || process.env.PAPERTRAIL_HOST
    ptOpts.port = ptOpts.port || process.env.PAPERTRAIL_PORT
    ptOpts.hostname = ptOpts.hostname || process.env.PAPERTRAIL_HOSTNAME

    if (ptOpts.host && typeof ptOpts.host !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "ptOpts.host <String>"'])
    if (ptOpts.port && typeof ptOpts.port !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "ptOpts.port <String>"'])
    if (ptOpts.hostname && typeof ptOpts.hostname !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "ptOpts.hostname <String>"'])
  }

  if (prefix && typeof prefix !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "prefix <String>"'])
  if (suffix && typeof suffix !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "suffix <String>"'])
  msgOpts.prefix = prefix
  msgOpts.suffix = suffix
  msgOpts.disabled = ptOpts.disabled

  if (
    !ptOpts.disabled &&
    ptOpts.host && // TODO: Make sure right type
    ptOpts.port &&
    ptOpts.hostname
  ) {
    remoteLogger = syslog.createClient(ptOpts.host, {
      port: ptOpts.port,
      syslogHostname: ptOpts.hostname,
      appName: 'default:', // Same as Winston for consistency
      transport: syslog.Transport.Udp,
      rfc3164: false // Use RFC5424
    })
  }
}

/**
 * Logger function
 * @description This function will log a message with a level of severity
 * @param {string}          level     The severity of the message
 * @param {array<string>}   message   An array of strings which is joined by a hyphen in the log message
 * @returns {Promise<void>}
 */
function logger (level, message) {
  // TODO: Create modules
  const time = new Date()
  const fDate = `${time.getDate()}/${time.getMonth()}/${time.getFullYear()}`
  const fTime = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`

  const messageArray = Array.isArray(message) ? message : [message]
  let syslogSeverity = logLevelMapper(level)

  if (syslogSeverity === undefined) {
    logger('error', ['Unknown log level', level, 'using \'warn\' level instead'])
    level = 'warn'
    syslogSeverity = logLevelMapper(level)
  }

  msgOpts.prefix && messageArray.unshift(msgOpts.prefix)
  msgOpts.suffix && messageArray.push(msgOpts.suffix)

  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}` : ''
  const logMessage = `${funcDetails}: ${messageArray.join(' - ')}`
  const remoteLogMessage = `${level.toUpperCase()} - ${logMessage}`
  const localLogMessage = `[ ${fDate} ${fTime} ] < ${level.toUpperCase()} >  ${logMessage}`

  // Undefined if Papertrail logging is disabled or not in a production environment
  if (remoteLogger) remoteLogger.log(remoteLogMessage, { severity: syslogSeverity })

  // TODO: Option to pass in custom logger? (Ex. "context.log()" from Azure Functions)
  console.log(localLogMessage)
}

module.exports = {
  logConfig,
  logger
}
