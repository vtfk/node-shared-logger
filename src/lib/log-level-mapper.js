const levelMapper = {
  error: {
    severity: 0,
    azureLevel: 'error'
  },
  warn: {
    severity: 1,
    azureLevel: 'warn'
  },
  info: {
    severity: 2,
    azureLevel: 'info'
  },
  verbose: {
    severity: 3,
    azureLevel: 'verbose'
  },
  debug: {
    severity: 4,
    azureLevel: 'verbose'
  },
  silly: {
    severity: 5,
    azureLevel: 'verbose'
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
        azureLevel: mappedLevel.azureLevel
      }
    }
  } catch (error) {
    return undefined
  }
}
