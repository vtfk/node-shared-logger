const levelMapper = {
  error: {
    severity: 0,
    azureLevel: 'error',
    teamsColor: 'ff0000'
  },
  warn: {
    severity: 1,
    azureLevel: 'warn',
    teamsColor: 'ffff00'
  },
  info: {
    severity: 2,
    azureLevel: 'info',
    teamsColor: '00ff00'
  },
  verbose: {
    severity: 3,
    azureLevel: 'verbose',
    teamsColor: '0000ff'
  },
  debug: {
    severity: 4,
    azureLevel: 'verbose',
    teamsColor: '0000ff'
  },
  silly: {
    severity: 5,
    azureLevel: 'verbose',
    teamsColor: '0000ff'
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
        teamsColor: mappedLevel.teamsColor
      }
    }
  } catch (error) {
    return undefined
  }
}
