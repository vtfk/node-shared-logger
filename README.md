# VTFK-logger

[![Build Status](https://travis-ci.com/vtfk/node-shared-logger.svg?branch=master)](https://travis-ci.com/vtfk/node-shared-logger)
[![Coverage Status](https://coveralls.io/repos/github/vtfk/node-shared-logger/badge.svg?branch=master)](https://coveralls.io/github/vtfk/node-shared-logger?branch=master)

A simple syslog logger for node applications. Logs to console and remote syslog aggregator.  
Only tested with Papertrail.

## Installation

`npm install --save @vtfk/logger`

## Usage

## Config
All options are optional. Logging to a remote syslog aggregator can be configured in logConfig() or as env variables.
```
const options = {
  remote: {                     // Options for remote logging. If undefined; disables remote logging
    onlyInProd: true,           // If true; only log to remote aggregator when NODE_ENV === 'production'
    host: '',                   // Hostname for the remote aggregator
    port: '',                   // Port for the remote aggregator
    serviceHostname: '',        // The identificator of this service
    serviceAppname: 'default:'  // The identificator of this application (defaults to "default:" for consistency with Winston)
  },
  prefix: '',                   // A string that will be added in front of each log message (ex. UID for each run)
  suffix: '',                   // A string that will be added at the end of each log message
  localLogger: console.log      // Replace the local logger with a custom function (Default: console.log)
}

logConfig(options)
```


### ENV Variables
```
PAPERTRAIL_HOST = papertrail.example.com
PAPERTRAIL_PORT = 5050
PAPERTRAIL_HOSTNAME = Cool-app
```
`logConfig()` options take priority.

### Examples
#### Ex. 1
The least amount of code to log to console or a remote syslog aggregator (if options are set in enviroment variables)
```js
const {logger} = require('@vtfk/logger')

logger('info', ['test', 'message'])
```
#### Ex. 2
Use logConfig to display a UID infront of each message
```js
const {logConfig, logger} = require('@vtfk/logger')
const nanoid = require('nanoid')

logConfig({
  prefix: nanoid()
})

logger('info', ['test', 'message'])

logger('warn', ['another', 'action'])

// OUTPUT 
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019-05-19 15:41:17 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: V01k3pDpHCBkAHPyCvOOl - test - message
[ 2019-05-19 15:41:17 ] < WARN >  {NAME-OF-APP} - {VER-OF-APP}: V01k3pDpHCBkAHPyCvOOl - another - action
```
#### Ex. 3
Configuration of remote options in the `logConfig()` function
```js
const {logConfig, logger} = require('@vtfk/logger')

// logConfig() is optional
logConfig({
  remote: {
    onlyInProd: true,
    host: 'papertrail.example.com',
    port: 5050,
    serviceHostname: 'my-server-name'
  }
  prefix: 'prefixedValue',
  suffix: 'suffixedValue'
})

logger('info', ['test', 'message'])

const error = Error('Error in process')
logger('error', ['Error in app', error])

// OUTPUT
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019-05-19 15:13:35 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - test - message - suffixedValue
[ 2019-05-19 15:13:35 ] < ERROR >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - Error in app - Error: Error in process - suffixedValue
```

## Logging
Remote logging is only enabled in a production enviroment (`NODE_ENV === 'production'`), unless `options.remote.onlyInProd === false`.

# License

[MIT](LICENSE)
