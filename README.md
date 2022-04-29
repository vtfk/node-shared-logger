<h1 align=center >VTFK Logger</h1>
<div align="center">
  <img src="https://img.shields.io/github/workflow/status/vtfk/node-shared-logger/Tests?label=Tests&style=for-the-badge"/><img src="https://img.shields.io/github/workflow/status/vtfk/node-shared-logger/Publish?label=Publish&style=for-the-badge"/><img src="https://img.shields.io/npm/v/@vtfk/logger?style=for-the-badge&color=success"/><img alt="Coveralls github branch" src="https://img.shields.io/coveralls/github/vtfk/node-shared-logger/master?style=for-the-badge">
</div>
<div align="center">
  <a href="https://github.com/vtfk/node-shared-logger"><img src="https://img.shields.io/static/v1?logo=github&label=&message=GITHUB&color=black&style=for-the-badge"/></a><a href="https://www.npmjs.com/package/@vtfk/logger"><img src="https://img.shields.io/static/v1?logo=npm&label=&message=NPM&color=red&style=for-the-badge"/></a>
</div>

<br>
<p align=center >A simple logger for node applications. Logs to console, papertrail (via token) and Azure Function.</p>
<br>

## Installation

`npm install --save @vtfk/logger`

## Usage

## Config
All options are optional.

Logging to papertrail can be configured in `logConfig()` or as env variables.

Logging to Microsoft Teams can be configured in `logConfig()` or as env variable **TEAMS_WEBHOOK_URL**.

Azure Function logging can be configured in `logConfig()`.

> Note: `logConfig()` can be called multiple times to update the config throughout the program.
  And it will keep the previous config parameter if not specified in the next call.

```js
const options = {
  remote: {                     // Options for remote logging.
    disabled: false,            // If true; disables logging to remote, even if remote config is set
    onlyInProd: true,           // If true; only log to remote aggregator when NODE_ENV === 'production' (default is true)
    host: '',                   // Host for the remote aggregator
    token: '',                  // Token for the remote aggregator
    level: ''                   // Lowest level for log to remote. If not set, all levels will log to remote
  },
  teams: {                      // Options for Microsoft Teams logging with webhook.
    disabled: false,            // If true; disables logging to Microsoft Teams, even if teams config is set
    onlyInProd: true,           // If true; only log to Microsoft Teams when NODE_ENV === 'production' (default is true)
    url: '',                    // Microsoft Teams channel webhook url
    level: ''                   // Lowest level for log to Microsoft Teams. If not set, all levels will log to Microsoft Teams
  },
  azure: {                      // Options for Azure
    context: context,           // The context object received from an Azure Function (see example further down)
    excludeInvocationId: false  // If true; do not append the invocationId from the context object
  },
  prefix: '',                   // A string that will be added in front of each log message (ex. UID for each run)
  suffix: '',                   // A string that will be added at the end of each log message
  error: {                      // Options for logging out Error object. If undefined; stack from Error object will be returned
    useMessage: true            // If true; use message from Error object instead of stack
  },
  localLogger: console.log      // Replace the local logger with a custom function (Default: console.log)
}

logConfig(options)
```


### ENV Variables
```bash
PAPERTRAIL_HOST = papertrail.example.com/v1/log
PAPERTRAIL_TOKEN = jvkuvuyoufyofo8ygo8f609fo7ouyvcio7=
TEAMS_WEBHOOK_URL = https://<tenant>.webhook.office.com/blablabla
```
`logConfig()` options take priority.

[How to get Microsoft Teams Webhook URL](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)


### Examples
#### Ex. Basic
The least amount of code to log to console or a remote aggregator (if options are set in enviroment variables)
```js
const { logger } = require('@vtfk/logger')

logger('info', ['test', 'message'])
```

#### Ex. Basic (async)
The least amount of code to log to console or a remote aggregator asynchronous (if options are set in enviroment variables)
```js
const { logger } = require('@vtfk/logger')

await logger('info', ['test', 'message'])
```

#### Ex. Basic with specifying Error property
Use logConfig to instruct that message property is used from Error objects
```js
const { logConfig, logger } = require('@vtfk/logger')

logConfig({
  error: {
    useMessage: true
  }
})

logger('info', ['test', 'message'])

logger('warn', ['another', 'action', new Error('Ups. Something happend')])

// OUTPUT 
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019.05.19 15:41:17 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: test - message
[ 2019.05.19 15:41:17 ] < WARN >  {NAME-OF-APP} - {VER-OF-APP}: another - action - Ups. Something happend
```

#### Ex. Basic without specifying Error property
```js
const { logger } = require('@vtfk/logger')

logger('info', ['test', 'message'])

logger('warn', ['another', 'action', new Error('Ups. Something happend')])

// OUTPUT 
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019.05.19 15:41:17 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: test - message
[ 2019.05.19 15:41:17 ] < WARN >  {NAME-OF-APP} - {VER-OF-APP}: another - action - Error: Ups. Something happend\n
```

#### Ex. Basic with prefix
Use logConfig to display a UID infront of each message
```js
const { logConfig, logger } = require('@vtfk/logger')
const nanoid = require('nanoid')

logConfig({
  prefix: nanoid()
})

logger('info', ['test', 'message'])

logger('warn', ['another', 'action'])

// OUTPUT 
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019.05.19 15:41:17 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: V01k3pDpHCBkAHPyCvOOl - test - message
[ 2019.05.19 15:41:17 ] < WARN >  {NAME-OF-APP} - {VER-OF-APP}: V01k3pDpHCBkAHPyCvOOl - another - action
```

#### Ex. Logging to remote or Microsoft Teams
Configuration of remote options in the `logConfig()` function
```js
const { logConfig, logger } = require('@vtfk/logger')

// logConfig() is optional
logConfig({
  remote: {
    onlyInProd: true,
    host: 'papertrail.example.com/v1/log',
    token: 'jvkuvuyoufyofo8ygo8f609fo7ouyvcio7='
  },
  teams: {
    url: 'https://<tenant>.webhook.office.com/blablabla'
  }
  prefix: 'prefixedValue',
  suffix: 'suffixedValue'
})

logger('info', ['test', 'message'])

const error = Error('Error in process')
logger('error', ['Error in app', error])

// OUTPUT
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019.05.19 15:13:35 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - test - message - suffixedValue
[ 2019.05.19 15:13:35 ] < ERROR >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - Error in app - Error: Error in process - suffixedValue
```

#### Ex. Logging to remote with a lowest level for remote or Microsoft Teams
Configuration of remote options in the `logConfig()` function
```js
const { logConfig, logger } = require('@vtfk/logger')

// logConfig() is optional
logConfig({
  remote: {
    onlyInProd: true,
    host: 'papertrail.example.com/v1/log',
    token: 'jvkuvuyoufyofo8ygo8f609fo7ouyvcio7=',
    level: 'warn'
  },
  teams: {
    url: 'https://<tenant>.webhook.office.com/blablabla',
    level: 'error'
  }
  prefix: 'prefixedValue',
  suffix: 'suffixedValue'
})

// this will NOT log to remote since this level is "info" and lowest remote level is set to "warn"
logger('info', ['test', 'message'])

// this will log to remote since this level is "error" and lowest remote level is set to "warn"
const error = Error('Error in process')
logger('error', ['Error in app', error])

// OUTPUT
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019.05.19 15:13:35 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - test - message - suffixedValue
[ 2019.05.19 15:13:35 ] < ERROR >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - Error in app - Error: Error in process - suffixedValue
```

#### Ex. Disable logging to remote or Microsoft Teams
Configuration of remote options in the `logConfig()` function
```js
const { logConfig, logger } = require('@vtfk/logger')

// logConfig() is optional
logConfig({
  remote: {
    disabled: true,
    onlyInProd: true,
    host: 'papertrail.example.com/v1/log',
    token: 'jvkuvuyoufyofo8ygo8f609fo7ouyvcio7='
  },
  teams: {
    disabled: true,
    url: 'https://<tenant>.webhook.office.com/blablabla'
  }
  prefix: 'prefixedValue',
  suffix: 'suffixedValue'
})

logger('info', ['test', 'message'])

const error = Error('Error in process')
logger('error', ['Error in app', error])

// OUTPUT
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019.05.19 15:13:35 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - test - message - suffixedValue
[ 2019.05.19 15:13:35 ] < ERROR >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - Error in app - Error: Error in process - suffixedValue
```

#### Ex. Azure Function
Pass the `context` object from Azure Function to add a invocationId and use `context.log[level](message)`.
> Note: If the `context` object contains all log functions (`context.log[levels]`) then it will log using these instead of `options.localLogger`
```js
const { logConfig, logger } = require('@vtfk/logger')

module.exports = async function (context, req) {
  logConfig({
      azure: { context }, // Pass in the context. (Shorthand for 'azure: { context: context }' )
      prefix: 'kittens'
  })
  logger('error', ['are too cute!'])
  logger('warn', ['can scratch'])
  logConfig({ azure: { excludeInvocationId: true } }) // Exclude the invocationId from now on
  logger('info', ['are cats'])

  context.res.body = '200 OK'
}

// OUTPUT 
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[2020-11-19T11:47:43.735Z] {NAME-OF-APP} - {VER-OF-APP}: 786df5ec-e19b-4f94-a65f-b86eed8df405 - kittens - are too cute!
[2020-11-19T11:47:43.737Z] {NAME-OF-APP} - {VER-OF-APP}: 786df5ec-e19b-4f94-a65f-b86eed8df405 - kittens - can scratch
[2020-11-19T11:47:43.737Z] {NAME-OF-APP} - {VER-OF-APP}: kittens - are cats // invocationId is now excluded
```

## Logging
Remote logging is only enabled in a production enviroment (`NODE_ENV === 'production'`), unless `options.remote.onlyInProd === false`.

# License

[MIT](LICENSE)
