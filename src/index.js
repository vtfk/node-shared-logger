const syslog = require('syslog-client')
const deepmerge = require('deepmerge')
const logLevelMapper = require('./lib/log-level-mapper')
const formatDateTime = require('./lib/format-date-time')
const { pkg } = require('./lib/get-package-json')
const logConfigFactory = require('./lib/log-config-factory')
const loggerFactory = require('./lib/logger-factory')
const { inProduction } = require('./lib/in-production')

// Store the options after configuration
const loggerOptions = {
  localLogger: console.log,
  onlyInProd: true
}

// Dependencies for the imported factory functions
const logConfigDeps = {
  syslog,
  deepmerge,
  loggerOptions,
  envVariables: process.env
}

const loggerDeps = {
  formatDateTime,
  logLevelMapper,
  loggerOptions,
  pkg,
  inProduction
}

/**
 * Logger configuration
 * @description Configure the logger and add message suffix/prefix
 * @param {object}    [options]                           Options for logging
 * @param {object}    [options.remote]                    Options for remote logging. If undefined; disables remote logging
 * @param {boolean}   [options.remote.onlyInProd=true]    If true; only log to remote aggregator when NODE_ENV === 'production'
 * @param {string}    [options.remote.host]               Hostname for the remote aggregator
 * @param {string}    [options.remote.port]               Port for the remote aggregator
 * @param {string}    [options.remote.serviceHostname]    The identificator of this service
 * @param {string}    [options.remote.serviceAppname="default:"]   The identificator of this application (defaults to "default:" for consistency with Winston)
 * @param {string}    [options.prefix]                    A string that will be added in front of each log message (ex. UID for each run)
 * @param {string}    [options.suffix]                    A string that will be added at the end of each log message
 * @param {function}  [options.localLogger=console.log]   Replace the local logger with a custom function (Default: console.log)
 * @returns {void}
 */
function logConfig (options = {}) { return logConfigFactory(options, logConfigDeps) }

/**
 * Logger function
 * @description This function will log a message with a level of severity
 * @param {string}          level     The severity of the message
 * @param {array<string>}   message   An array of strings which is joined by a hyphen in the log message
 * @returns {void}
 */
function logger (level, message) { return loggerFactory(level, message, loggerDeps) }

// Run logConfig just in case only env variables are used
logConfig()

module.exports = {
  logConfig,
  logger
}
