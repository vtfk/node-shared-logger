const { logger, logConfig } = require('./src')

logConfig({
  prefix: 'prefix',
  suffix: 'suffix',
  remote: {
    host: 'logs5.papertrailapp.com',
    port: '52658',
    serviceHostname: 'sherex-log-lib-test'
  }
})

logger('info', ['test message', 'test message 2'])
logger('error', ['test message', 'test message 2'])
