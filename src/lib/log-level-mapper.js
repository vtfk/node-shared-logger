const levelMapper = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
}

const longestLevelString = Object.keys(levelMapper).reduce((prev, curr) => curr.length > prev.length ? curr : prev)

module.exports = (level) => {
  try {
    const severity = levelMapper[level.toLowerCase()]
    if (typeof severity === 'number') {
      return {
        severity,
        level: level.toUpperCase(),
        padding: ' '.repeat(longestLevelString.length - level.length)
      }
    }
  } catch (error) {
    return undefined
  }
}
