const repl = require('repl')
require('foxver/server')(__dirname, {
  core: {
    components: {
      active: [
//        "hooks",
        "data",
        "services",
//        "http",
//        "controllers"
      ],
    },
    log: {
      level: 'error'
    }
  }
})

const index = require('./index')
const r = repl.start('> ')
