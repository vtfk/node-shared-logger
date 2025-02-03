const { Logtail } = require('@logtail/node')

function _logConfigFactory (options = {}, { axios, deepmerge, loggerOptions, envVariables }) {
  options = deepmerge(loggerOptions.previousOptions, options)
  loggerOptions.previousOptions = options
  if ((!options || !options.remote) && envVariables.PAPERTRAIL_HOST && envVariables.PAPERTRAIL_TOKEN) {
    options.remote = {
      host: envVariables.PAPERTRAIL_HOST,
      token: envVariables.PAPERTRAIL_TOKEN
    }
  }
  if ((!options || !options.teams) && envVariables.TEAMS_WEBHOOK_URL) {
    options.teams = {
      url: envVariables.TEAMS_WEBHOOK_URL
    }
  }
  if ((!options || !options.betterstack) && envVariables.BETTERSTACK_URL && envVariables.BETTERSTACK_TOKEN) {
    options.betterstack = {
      url: envVariables.BETTERSTACK_URL,
      token: envVariables.BETTERSTACK_TOKEN
    }
  }
  if (options && typeof options === 'object') {
    // remote logging
    if (options.remote && typeof options.remote === 'object') {
      options.remote.host = options.remote.host || envVariables.PAPERTRAIL_HOST
      options.remote.token = options.remote.token || envVariables.PAPERTRAIL_TOKEN

      loggerOptions.remoteLogger = {
        log: async msg => await axios.post(options.remote.host, msg, { auth: { password: options.remote.token } })
      }

      // onlyInProd defaults to true
      loggerOptions.onlyInProd = options.remote.onlyInProd === undefined ? true : options.remote.onlyInProd
      options.remote.onlyInProd = loggerOptions.onlyInProd

      // enables remote logging if everything checks out, otherwise remote logging will be disabled
      loggerOptions.logToRemote = !options.remote.disabled &&
        typeof options.remote.host === 'string' &&
        typeof options.remote.token === 'string'

      // set remote level (lowest level for remote logging)
      if (options.remote.level) {
        loggerOptions.remoteLevel = options.remote.level
      }
    }

    // Betterstack logging
    if (options.betterstack && typeof options.betterstack === 'object') {
      options.betterstack.url = options.betterstack.url || envVariables.BETTERSTACK_URL
      options.betterstack.token = options.betterstack.token || envVariables.BETTERSTACK_TOKEN

      const logtail = new Logtail(options.betterstack.token, {
        endpoint: options.betterstack.url
      })

      loggerOptions.betterstackLogger = {
        log: async (level, msg) => {
          const betterstackUrl = new URL(options.betterstack.url)
          if (!betterstackUrl.hostname.endsWith('betterstackdata.com')) {
            throw new Error('Invalid Betterstack URL, must end with betterstackdata.com')
          }
          if (!betterstackUrl.protocol === 'https:') {
            throw new Error('Invalid Betterstack URL, must use HTTPS')
          }
          if (['silly', 'verbose'].includes(level)) level = 'debug' // Betterstack does not support silly level
          logtail[level](msg) // Log to Betterstack with package to get batching and retry logic, and colors! (må vi ha await??)
        }
      }

      // onlyInProd defaults to true
      loggerOptions.onlyInProd = options.betterstack.onlyInProd === undefined ? true : options.betterstack.onlyInProd
      options.betterstack.onlyInProd = loggerOptions.onlyInProd

      // enables betterstack logging if everything checks out, otherwise betterstack logging will be disabled
      loggerOptions.logToBetterstack = !options.betterstack.disabled &&
        typeof options.betterstack.url === 'string' &&
        typeof options.betterstack.token === 'string'

      // set betterstack level (lowest level for betterstack logging)
      if (options.betterstack.level) {
        loggerOptions.betterstackLevel = options.betterstack.level
      }
    }
    // Teams logging
    if (options.teams && typeof options.teams === 'object') {
      options.teams.url = options.teams.url || envVariables.TEAMS_WEBHOOK_URL

      loggerOptions.teamsLogger = {}
      if (options.teams.url && typeof options.teams.url === 'string') {
        if (options.teams.url.includes('webhook.office.com')) { // Gamlemåten Office webhooks
          loggerOptions.teamsLogger.log = async cards => await axios.post(options.teams.url, cards.messageCard)
        } else { // Power Automate måten
          loggerOptions.teamsLogger.log = async cards => await axios.post(options.teams.url, cards.adaptiveCard) // Format adaptive card to match Power Automate format
        }
      } else {
        loggerOptions.teamsLogger.log = async cards => console.log('No teams URL provided, teams logging disabled')
      }

      // onlyTeamsInProd defaults to true
      loggerOptions.onlyTeamsInProd = options.teams.onlyInProd === undefined ? true : options.teams.onlyInProd
      options.teams.onlyInProd = loggerOptions.onlyTeamsInProd

      // enables teams logging if everything checks out, otherwise teams logging will be disabled
      loggerOptions.logToTeams = !options.teams.disabled && typeof options.teams.url === 'string'

      // set teams level (lowest level for teams logging)
      loggerOptions.teamsLevel = options.teams.level || 'warn' // Default log level for Teams is set to WARN
    }
  }

  loggerOptions.error = typeof options.error === 'object' ? options.error : undefined
  loggerOptions.prefix = typeof options.prefix === 'string' ? options.prefix : undefined
  loggerOptions.suffix = typeof options.suffix === 'string' ? options.suffix : undefined

  if (typeof options.localLogger === 'function') {
    loggerOptions.localLogger = options.localLogger
  }

  if (typeof options.azure !== 'undefined' && typeof options.azure.context !== 'undefined') {
    loggerOptions.azure = {}

    if (typeof options.azure.context.invocationId === 'string') {
      loggerOptions.azure.invocationId = options.azure.context.invocationId
    }

    const log = options.azure.context.log
    if (log && log.error && log.warn && log.info && log.verbose) {
      loggerOptions.azure.log = log
    }

    if (options.azure.excludeInvocationId === true) {
      loggerOptions.azure.excludeInvocationId = options.azure.excludeInvocationId
    }
  }
}

module.exports = _logConfigFactory
