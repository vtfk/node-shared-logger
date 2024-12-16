const levelMapper = {
  error: {
    severity: 0,
    azureLevel: 'error',
    teamsColor: 'ff0000',
    adaptiveCardColor: 'attention'
  },
  warn: {
    severity: 1,
    azureLevel: 'warn',
    teamsColor: 'ffff00',
    adaptiveCardColor: 'warning'
  },
  info: {
    severity: 2,
    azureLevel: 'info',
    teamsColor: '00ff00',
    adaptiveCardColor: 'good'
  },
  verbose: {
    severity: 3,
    azureLevel: 'verbose',
    teamsColor: '0000ff',
    adaptiveCardColor: 'accent'
  },
  debug: {
    severity: 4,
    azureLevel: 'verbose',
    teamsColor: '0000ff',
    adaptiveCardColor: 'accent'
  },
  silly: {
    severity: 5,
    azureLevel: 'verbose',
    teamsColor: '0000ff',
    adaptiveCardColor: 'accent'
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
        teamsColor: mappedLevel.teamsColor,
        adaptiveCardColor: mappedLevel.adaptiveCardColor
      }
    }
  } catch (error) {
    return undefined
  }
}
