const jsdom = require('node-jsdom')
const {RateLimiter} = require('limiter')
const superagent = require('superagent')

class Scraper {
  log(message) {
    return function log(r) {console.log(JSON.stringify({message: message, data: r}))}
  }

  constructor() {
    this.requestLimiter = new RateLimiter(1, 'second')
    this.tasks = {}
  }

  exceptionResult(e, data={}) {
    return {
      type: 'error',
      exception: {message: e.message, stack: e.stack},
      data: data
    }
  }

  get(url, cb) {
    this.requestLimiter.removeTokens(1, () => {
      superagent.get(url).end(cb)
    })
  }

  scrape(url, func) {
    this.log('fetching')({url: url})
    this.get(url, (err, res) => {
      try {
        if (err) throw err
        let doc = jsdom.jsdom(res.text, {url: url})
        let window = doc.defaultView
        try {
          jsdom.jQueryify(window, 'http://code.jquery.com/jquery.js', func)
        } catch (e) {
          this.sendEvent(this.exceptionResult(e, {url: url, html: window.$('html').html()}))
        }
      } catch (e) {
        this.sendEvent(this.exceptionResult(e, {url: url}))
      }
    })
  }

  sendEvent(result) {
    console.log(JSON.stringify({event: result}))
    let funcs = this.handlers[result.type] || this.handlers.default
    funcs.forEach((func) => {
      try {
        func(result)
      } catch (e) {
        this.sendEvent(this.exceptionResult(e))
      }
    })
  }

  runScraper(hs, startOpts = {}){
    this.handlers = hs
    this.sendEvent(Object.assign({type: 'start'}, startOpts))
  }


  taskStatus(taskName) {
    let statuses = []
    for (let key in this.tasks) {
      if (key.startsWith(taskName)) {
        statuses.push(this.tasks[key])
      }
    }
    if (statuses.length === 0) return 'pending'
    if (statuses.some((s) => s === 'failed')) return 'failed'
    if (statuses.some((s) => s === 'pending')) return 'pending'
    return 'succeeded'
  }

  taskDone(taskName, status) {
    this.tasks[taskName] = status
    console.log(JSON.stringify({tasks: this.tasks}))
    for (let eventName in this.handlers) {
      if (eventName.includes(':')) {
        let [task, triggerStatus] = eventName.split(':')
        if (status === triggerStatus && this.taskStatus(task) === triggerStatus) {
          this.sendEvent({
            type: eventName,
            status: triggerStatus
          })
        }
      }
    }
  }

  interpolateTaskName(taskName, eventData) {
    if (typeof taskName === 'function') return taskName(eventData)
    return taskName
  }

  newTask(taskName) {
    return (eventData) => {
      // should this leave existing values?
      this.tasks[this.interpolateTaskName(taskName, eventData)] = 'pending'
    }
  }

  // if all sub tasks are successful, emit parent task success events
  taskSucceeded(taskName) {
    return (eventData) => {
      // should this overwrite failure?
      this.taskDone(this.interpolateTaskName(taskName, eventData), 'succeeded')
    }
  }

  // if any sub task is failed, emit parent task failure events
  taskFailed(taskName) {
    return (eventData) => {
      // should this overwrite success?
      this.taskDone(this.interpolateTaskName(taskName, eventData), 'failed')
    }
  }
}

module.exports = Scraper
