const axios = require('axios').default
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
  axios,
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
 * @param {object}    [options.remote]                    Options for remote logging. If undefined and PAPERTRAIL_HOST/PAPERTRAIL_TOKEN is not set in env; disables remote logging
 * @param {boolean}   [options.remote.onlyInProd=true]    If true; only log to remote aggregator when NODE_ENV === 'production'
 * @param {string}    [options.remote.host]               Host for the remote aggregator
 * @param {string}    [options.remote.token]              Token for the remote aggregator
 * @param {string}    [options.remote.level]              Lowest level for log to remote. If not set, all levels will log to remote
 * @param {boolean}   [options.remote.disabled]           Disable remote logging
 * @param {object}    [options.teams]                     Options for teams logging. If undefined and TEAMS_WEBHOOK_URL is not set in env; disables teams logging
 * @param {boolean}   [options.teams.onlyInProd=true]     If true; only log to teams when NODE_ENV === 'production'
 * @param {string}    [options.teams.url]                 URL to teams webhook
 * @param {string}    [options.teams.level]               Lowest level for log to teams. If not set, defaults to WARN
 * @param {boolean}   [options.teams.disabled]            Disable teams logging
 * @param {string}    [options.prefix]                    A string that will be added in front of each log message (ex. UID for each run)
 * @param {string}    [options.suffix]                    A string that will be added at the end of each log message
 * @param {string}    [options.error.useMessage]          Use message property on error objects. If undefined; stack property will be used
 * @param {function}  [options.localLogger=console.log]   Replace the local logger with a custom function (Default: console.log)
 * @returns {void}
 */
function logConfig (options = {}) { return logConfigFactory(options, logConfigDeps) }

/**
 * Logger function
 * @description This function will log a message with a level of severity
 * @param {string}          level     The severity of the message
 * @param {array<string>}   message   An array of strings which is joined by a hyphen in the log message
 * @param {object}          [context] A context object from azure - for context log without memory clutter and conflicting invocation ids
 * @returns {void}
 */
async function logger (level, message, context) { return await loggerFactory(level, message, loggerDeps, context) }

// Run logConfig just in case only env variables are used
logConfig()

module.exports = {
  logConfig,
  logger
}
