module.exports = (msg, errorProperty) => {
  return typeof msg === 'object' ? msg instanceof Error ? msg[errorProperty] : JSON.stringify(msg) : msg
}
