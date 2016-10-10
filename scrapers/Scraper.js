const cheerio = require('cheerio')
const {RateLimiter} = require('limiter')
const superagent = require('superagent')
const UrlPattern = require('url-pattern')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const inflection = require('inflection')
const moment = require('moment')
const {slackStatus, slackSuccess, slackFailure} = require('./Helpers.js')

function jsonLog(obj) { console.log(JSON.stringify(obj, null, 2)) }

class Scraper {
  constructor(name, opts={}) {
    this.name = name
    this.requestLimiter = new RateLimiter(...(opts.rateLimit || [20, 'minute']))
    this.extractors = []
    this.loaders = []
    this.scrapeResults = {}
    this.initialUrl = null
    this.initialUrls = []
  }

  run() {
    return async (function run() {
      const scrapeStartTime = new Date()
      try {
        slackStatus(`${this.name} STARTED`)
        if (this.initialUrl) {
          await(this.get(this.initialUrl))
        }
        for (let i = 0; i < this.initialUrls.length; i++) {
          await(this.get(this.initialUrls[i]))
        }
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
      const [path, params] = url.split('?')
      for (let i = 0; i < this.extractors.length; i++) {
        const extractor = this.extractors[i]
        const match = extractor.pattern.match(path)
        if (match) {
          anyMatch = true
          jsonLog({extract: {url: url, extractor: {pattern: extractor.patternString, extractor: extractor.cb.name, opts: extractor.opts || undefined}}})
          let req = {url: url, params: match}
          if (extractor.opts.parseDom) { req.$ = cheerio.load(res.text) }
          if (extractor.opts.jsonBody) { req.body = JSON.parse(res.text) }
          extractor.cb(req, extractorRes)
        }
      }
      if (!anyMatch) {
        jsonLog({error: {message: 'no extractor for url', url: path}})
        throw {message: 'no extractor for url', url: path}
      }
      return Promise.all(promises)
    } catch (e) {
      e.url = url
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
    this.extractors.push({patternString: pattern, pattern: new UrlPattern('(http(s)\\://)(www.)' + pattern), cb: cb, opts: opts})
  }

  loader(cb) {
    this.loaders.push(cb)
  }
}

module.exports = Scraper
