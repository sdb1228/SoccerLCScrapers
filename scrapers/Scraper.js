const cheerio = require('cheerio')
const {RateLimiter} = require('limiter')
const superagent = require('superagent')
const UrlPattern = require('url-pattern')

class Task extends UrlPattern {
  constructor(scraper, taskName) {
    super(taskName)
    this.succeeded = `${taskName}?succeeded`
    this.failed = `${taskName}?failed`
    this.scraper = scraper
  }

  start() {
    return function start(eventData) {
      this.scraper.taskPending(this.stringify(eventData))
    }.bind(this)
  }

  succeed() {
    return function succeed(eventData) {
      this.scraper.taskSucceeded(this.stringify(eventData))
    }.bind(this)
  }

  fail() {
    return function fail(eventData) {
      this.scraper.taskFailed(this.stringify(eventData))
    }.bind(this)
  }
}

class Scraper {
  log(message) {
    return function log(r) {console.log(JSON.stringify({message: message, data: r}))}
  }

  constructor() {
    this.requestLimiter = new RateLimiter(20, 'minute')
    this.tasks = {}
  }

  exceptionResult(e, event, data={}) {
    return {
      type: 'error',
      event: event,
      exception: {message: e.message, stack: e.stack},
      data: data
    }
  }

  get(url, cb) {
    this.requestLimiter.removeTokens(1, () => {
      superagent.get(url).end(cb)
    })
  }

  scrape(event, url, func) {
    this.log('fetching')({url: url})
    this.get(url, (err, res) => {
      try {
        if (err) throw err
        let $ = cheerio.load(res.text)
        try {
          func($)
        } catch (e) {
          this.sendEvent(this.exceptionResult(e, event, {url: url, html: $.html()}))
        }
        func = null
      } catch (e) {
        this.sendEvent(this.exceptionResult(e, event, {url: url}))
      }
    })
  }

  rawScrape(event, url, func) {
   this.log('fetching')({url: url})
   this.get(url, (err, res) => {
     try {
       if (err) throw err
       func(res)
     } catch (e) {
       this.sendEvent(this.exceptionResult(e, event, {url: url}))
     }
   })
 }

  sendEvent(result) {
    console.log(JSON.stringify({event: result}))
    let funcs = this.handlers[result.type] || this.handlers.default
    funcs.forEach((func) => {
      setImmediate(() => {
        try {
          func(result)
        } catch (e) {
          this.sendEvent(this.exceptionResult(e, result))
        }
      })
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
    console.log(JSON.stringify({task: taskName, status: status}))
    for (let handler in this.handlers) {
      // if the handler is a task event...
      if (handler.includes('?')) {
        // get the task and status to trigger on
        let [task, triggerStatus] = handler.split('?')
        // see if our just completed task could trigger the handler
        let pat = new UrlPattern(`${task}(/*)`)
        let match = pat.match(taskName)
        if (match) {
          // if the handler's status is would activate the trigger...
          delete match._ // some extra match junk
          if (match && status === triggerStatus && this.taskStatus(pat.stringify(match)) === triggerStatus) {
            this.sendEvent(Object.assign({
              type: handler,
              status: triggerStatus
            }, match))
          }
        }
      }
    }
  }

  newTask(taskName) {
    return new Task(this, taskName)
  }

  taskPending(taskName) {
    // should this leave existing values?
    this.tasks[taskName] = 'pending'
  }

  // if all sub tasks are successful, emit parent task success events
  taskSucceeded(taskName) {
    // should this overwrite failure?
    this.taskDone(taskName, 'succeeded')
  }

  // if any sub task is failed, emit parent task failure events
  taskFailed(taskName) {
    // should this overwrite success?
    this.taskDone(taskName, 'failed')
  }
}

module.exports = Scraper
