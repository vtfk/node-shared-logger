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
    // Teams logging
    if (options.teams && typeof options.teams === 'object') {
      options.teams.url = options.teams.url || envVariables.TEAMS_WEBHOOK_URL

      loggerOptions.teamsLogger = {}
      if (options.teams.url.includes('webhook.office.com')) { // Gamlemåten Office webhooks
        loggerOptions.teamsLogger.log = async cards => await axios.post(options.teams.url, cards.messageCard)
      } else { // Power Automate måten
        loggerOptions.teamsLogger.log = async cards => await axios.post(options.teams.url, cards.adaptiveCard) // Format adaptive card to match Power Automate format
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
