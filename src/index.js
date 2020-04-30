const packPath = require('packpath').parent()
const { join } = require('path')
const syslog = require('syslog-client')

const pkg = require(join(packPath, 'package.json'))


// Store the options after configuration
let remoteLogger
let msgOpts = {}

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
  if (ptOpts && typeof ptOpts !== 'object') logger('warn', ['Logger config', 'Wrong type on parameter "ptOpts <Object>"'])
  if (!ptOpts.disabled) { // TODO: Throw here?
    if (ptOpts.host && typeof ptOpts.host !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "ptOpts.host <String>"'])
    if (ptOpts.port && typeof ptOpts.port !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "ptOpts.port <String>"'])
    if (ptOpts.hostname && typeof ptOpts.hostname !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "ptOpts.hostname <String>"'])

    ptOpts.host = ptOpts.host || process.env.PAPERTRAIL_HOST
    ptOpts.port = ptOpts.port || process.env.PAPERTRAIL_PORT
    ptOpts.hostname = ptOpts.hostname || process.env.PAPERTRAIL_HOSTNAME
  }
  

  if (prefix && typeof prefix !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "prefix <String>"'])
  if (suffix && typeof suffix !== 'string') logger('warn', ['Logger config', 'Wrong type on parameter "suffix <String>"'])
  msgOpts.prefix = prefix
  msgOpts.suffix = suffix
  msgOpts.disabled = ptOpts.disabled

  if (
    process.env.NODE_ENV === 'production' &&
    !ptOpts.disabled &&
    ptOpts.host && // TODO: Make sure right type
    ptOpts.port &&
    ptOpts.hostname
  ) {
    remoteLogger = syslog.createClient(ptOpts.host, {
      port: ptOpts.port,
      syslogHostname: ptOpts.hostname,
      appName: ptOpts.hostname
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
async function logger (level, message) {
  const time = new Date()
  const fDate = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}`
  const fTime = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`

  const messageArray = Array.isArray(message) ? message : [message]

  msgOpts.prefix && messageArray.unshift(msgOpts.prefix)
  msgOpts.suffix && messageArray.push(msgOpts.suffix)

  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}: ` : ''
  const logMessage = `${funcDetails}${messageArray.join(' - ')}`
  const localLogMessage = `[ ${fDate} ${fTime} ] < ${level.toUpperCase()} >  ${(logMessage ? logMessage : '')}`

  // Undefined if Papertrail logging is disabled or not in a production environment
  if (remoteLogger) remoteLogger.log(level, logMessage)

  // TODO: Option to pass in custom logger? (Ex. "context.log()" from Azure Functions)
  console.log(localLogMessage)
}

module.exports = {
  logConfig,
  logger
}