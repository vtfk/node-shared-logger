# VTFK-logger
A simple logger for node applications using winston. Logs to console and Papertrail

## Usage

The Papertrail options in `config()` can be set in these enviroment variables too:
```
PAPERTRAIL_HOST = papertrail.example.com
PAPERTRAIL_PORT = 5050
PAPERTRAIL_HOSTNAME = Cool-app
```
If both are set the parameters in `config()` are used.

In the 'config()' function you can also specify a prefixed value (ex: UID for each event), or an suffixed value.

### Examples
The least amount of code to log to console or Papertrails (if options are set in enviroment variables)
```js
const {logger} = require('vtfk-logger')

logger('info', ['test', 'message'])
```

Use config to display a UID infront of each message
```js
const {config, logger} = require('vtfk-logger')
const nanoid = require('nanoid')

config({}, nanoid())

logger('info', ['test', 'message'])

logger('warn', ['another', 'action'])

// OUTPUT 
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019-05-19 15:41:17 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: V01k3pDpHCBkAHPyCvOOl - test - message - 
[ 2019-05-19 15:41:17 ] < WARN >  {NAME-OF-APP} - {VER-OF-APP}: V01k3pDpHCBkAHPyCvOOl - another - action -
```

Configuration of Papertrail in the `config()` function
```js
const {config, logger} = require('vtfk-logger')

const papertrailOptions = {
  host: 'papertrail.example.com',
  port: '5050',
  hostname: 'Cool-app'
}

// Config is optional
config(papertrailOptions, 'prefixedValue', 'suffixedValue')

logger('info', ['test', 'message'])

const error = Error('Error in process')
logger('error', ['Error in app', error])

// OUTPUT
// NAME-OF-APP and VER-OF-APP is the value of "name" and "version" in your package.json
[ 2019-05-19 15:13:35 ] < INFO >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - test - message - suffixedValue
[ 2019-05-19 15:13:35 ] < ERROR >  {NAME-OF-APP} - {VER-OF-APP}: prefixedValue - Error in app - Error: Error in process - suffixedValue
```

## Logging
It will only log to Papertrail if in a production enviroment (NODE_ENV === 'production'), and the Papertrails host, port and hostname is set.

It will log to console when not in a production enviroment.

# License

[MIT](LICENSE)