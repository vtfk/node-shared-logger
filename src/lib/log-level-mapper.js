const levelMapper = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
}

module.exports = (level) => {
  level = level.toLowerCase()
  if (levelMapper[level] !== undefined) {
    return levelMapper[level]
  }
}
