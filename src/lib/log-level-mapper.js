const levelMapper = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
}

module.exports = (level) => {
  try {
    level = level.toLowerCase()
    return levelMapper[level]
  } catch (error) {
    return undefined
  }
}
