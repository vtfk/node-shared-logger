const { createLogger, format, transports } = require('winston');
require('winston-papertrail').Papertrail


let pkg
try { pkg = require(process.env.PWD + '/.package.json') } catch {}
try { pkg = require(require.main.filename + '/package.json') } catch {}


const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'your-service-name' }
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.timestamp(),
      format.printf(options => `[ ${options.timestamp} ] < ${options.level.toUpperCase()} >  ${(options.message ? options.message : '')}`)
    )
  }));
}

// Store the options after configuration
let msgOpts = {}

/**
 * Logger configuration
 * @description Configure the logger for Papertrail and add message suffix/prefix
 * @param {object}  options           Options for Papertrail
 * @param {string}  options.host      Hostname for the Papertrail server
 * @param {string}  options.port      Port for the Papertrail server
 * @param {string}  options.hostname  The name identifying name of the service (application / server)
 * @param {string}  prefix            A string that will be added in front of each log message (ex. UID for each run)
 * @param {string}  suffix            A string that will be added at the end of each log message
 * @returns {void}
 */
module.exports.config = (papertrailOpts, prefix, suffix) => {
  msgOpts.prefix = prefix || ''
  msgOpts.suffix = suffix || ''
  
  if (
    process.env.NODE_ENV === 'production' &&
    papertrailOpts.host &&
    papertrailOpts.port &&
    papertrailOpts.hostname
  ) {
    logger.add(new transports.Papertrail({
      host: papertrailOpts.host,
      port: papertrailOpts.port,
      hostname: papertrailOpts.hostname,
      logFormat: (level, message) => `${level.toUpperCase()} - ${message || ''}`
    }))
  }
}

/**
 * Logger function
 * @description This function will log a message with a level of severity
 * @param {string}          level     The severity of the message
 * @param {array<string>}   message   An array of strings which is joined by a hyphen in the log message
 * @returns {Promise<void>}
 */
module.exports.logger = async (level, message) => {
  const messageArray = Array.isArray(message) ? message : [message]
  messageArray.unshift(msgOpts.prefix)
  messageArray.push(msgOpts.suffix)
  const funcDetails = pkg && pkg.version ? `${pkg.name} - ${pkg.version}: ` : ''
  const logMessage = `${funcDetails}${messageArray.join(' - ')}`
  logger.log(level, logMessage)
}


