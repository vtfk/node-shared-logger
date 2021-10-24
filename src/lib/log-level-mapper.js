const levelMapper = {
  error: {
    severity: 0,
    azureLevel: 'error',
    winstonLevel: 'err'
  },
  warn: {
    severity: 1,
    azureLevel: 'warn',
    winstonLevel: 'warning'
  },
  info: {
    severity: 2,
    azureLevel: 'info',
    winstonLevel: 'info'
  },
  verbose: {
    severity: 3,
    azureLevel: 'verbose',
    winstonLevel: 'notice'
  },
  debug: {
    severity: 4,
    azureLevel: 'verbose',
    winstonLevel: 'debug'
  },
  silly: {
    severity: 5,
    azureLevel: 'verbose',
    winstonLevel: 'crit'
  }
}

const longestLevelString = Object.keys(levelMapper).reduce((prev, curr) => curr.length > prev.length ? curr : prev)

module.exports = (level) => {
  try {
    const mappedLevel = levelMapper[level.toLowerCase()]
    if (typeof mappedLevel === 'object') {
      return {
        severity: mappedLevel.severity,
        level: level.toUpperCase(),
        padding: ' '.repeat(longestLevelString.length - level.length),
        azureLevel: mappedLevel.azureLevel,
        winstonLevel: mappedLevel.winstonLevel
      }
    }
  } catch (error) {
    return undefined
  }
}
