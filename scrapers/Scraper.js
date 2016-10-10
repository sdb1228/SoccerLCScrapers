const cheerio = require('cheerio')
const {RateLimiter} = require('limiter')
const superagent = require('superagent')
const UrlPattern = require('url-pattern')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const inflection = require('inflection')
const moment = require('moment')
const {slackSuccess, slackFailure} = require('./Helpers.js')

function jsonLog(obj) { console.log(JSON.stringify(obj, null, 2)) }

class Scraper {
  constructor(name) {
    this.name = name
    this.requestLimiter = new RateLimiter(20, 'minute')
    this.extractors = []
    this.loaders = []
    this.scrapeResults = {}
    this.initialUrl = null
  }

  run() {
    return async (function run() {
      const scrapeStartTime = new Date()
      try {
        await(this.get(this.initialUrl))
        slackSuccess(`${this.name} SCRAPED in ${moment.duration(new Date() - scrapeStartTime).humanize()}`)
        const loadStartTime = new Date()
        try {
          await(this.load(this.scrapeResults))
          slackSuccess(`${this.name} LOADED in ${moment.duration(new Date() - loadStartTime).humanize()}`)
        } catch (e) {
          console.log(e)
          slackFailure(`${this.name} LOAD FAILED in ${moment.duration(new Date() - loadStartTime).humanize()}`, e)
        }
      } catch (e) {
        console.log(e)
        slackFailure(`${this.name} SCRAPE FAILED in ${moment.duration(new Date() - scrapeStartTime).humanize()}`, e)
      }
    }.bind(this))()
  }

  get(url) {
    return new Promise((resolve, reject) => {
      this.requestLimiter.removeTokens(1, () => {
        jsonLog({get: {url: url}})
        superagent.get(url).end((err, res) => {
          if (err) {reject(err)}
          this.extract(url, res).then(resolve).catch(reject)
        })
      })
    })
  }

  save(json) {
    // todo: maybe persist this to a db
    return new Promise((resolve, reject) => {
      const trimmed = JSON.parse(JSON.stringify(json).replace(/"\s+|\s+"/g,'"'))
      jsonLog({save: trimmed})
      const key = inflection.pluralize(trimmed.type)
      if (!this.scrapeResults[key]) { this.scrapeResults[key] = [] }
      this.scrapeResults[key].push(trimmed)
      resolve()
    })
  }

  extract(url, res) {
    try {
      let promises = []
      let anyMatch = false
      const extractorRes = {
        get: function(url) {
          promises.push(this.get(url))
        }.bind(this),
        save: function(json) {
          promises.push(this.save(json))
        }.bind(this)
      }
      for (let i = 0; i < this.extractors.length; i++) {
        const extractor = this.extractors[i]
        const match = extractor.pattern.match(url)
        if (match) {
          anyMatch = true
          jsonLog({extract: {url: url, extractor: {pattern: extractor.patternString, extractor: extractor.cb.name, opts: extractor.opts || undefined}}})
          let req = {params: match}
          if (extractor.opts.parseDom) { req.$ = cheerio.load(res.text) }
          if (extractor.opts.jsonBody) { req.body = JSON.parse(res.text) }
          extractor.cb(req, extractorRes)
        }
      }
      if (!anyMatch) {
        jsonLog({warning: {message: 'no extractor for url', url: url}})
      }
      return Promise.all(promises)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  load() {
    return async (function load() {
      for (let i = 0; i < this.loaders.length; i++) {
        const loader = this.loaders[i]
        // jsonLog({load: {loader: loader.name}}) // asyncawait eats function names so this is useless
        await (loader(this.scrapeResults))
      }}.bind(this))()
  }

  domExtractor(pattern, cb) {
    this.rawExtractor(pattern, cb, {parseDom: true})
  }

  jsonExtractor(pattern, cb) {
    this.rawExtractor(pattern, cb, {jsonBody: true})
  }

  rawExtractor(pattern, cb, opts) {
    this.extractors.push({patternString: pattern, pattern: new UrlPattern(pattern), cb: cb, opts: opts})
  }

  loader(cb) {
    this.loaders.push(cb)
  }
}

module.exports = Scraper
