const querystring = require('querystring')
const R = require('ramda')

const DEFAULT_LIMIT = 300
const MAXIMUM_LIMIT = 500

function limitLimiter(req) {
  return req.query.limit = R.compose(R.clamp(1, MAXIMUM_LIMIT), R.defaultTo(DEFAULT_LIMIT), parseInt)(req.query.limit)
}

class Cursor {
  constructor(req, res, model, keys, opts={}) {
    this.model = model
    // todo: check that keys are in model (and maybe that they're non-null)
    this.keys = keys
    this.res = res
    this.cursor = null
    this.where = opts.where || {}
    this.findAllOpts = R.omit(['where', 'limit', 'order'], opts) // maybe switch to whitelisting acceptable find options

    const [url, queryString] = (req.protocol + '://' + req.get('host') + req.originalUrl).split('?')
    this.url = url
    this.query = querystring.parse(queryString)
    if (req.query.cursor) {
      try {
        const params = JSON.parse(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
        // todo: check that params includes all and only the keys we expect
        this.cursor = {}
        for (const key of keys) {
          // todo: type check params against the model
          this.cursor[key] = params[key]
        }
      } catch(e) { throw 'invalid cursor params' }
    }
  }

  whereClause() {
    if (!this.cursor) { return this.where }
    return {
      $and: [
        this.where,
        {
          $or: R.mapAccum(
            (fields, gtKey) => [
              R.omit(gtKey, fields),
              R.evolve({[gtKey]: R.objOf('$gt')}, fields)
            ],
            this.cursor,
            R.reverse(this.keys)
          )[1]
        }
      ]
    }
  }

  getPage() {
    // you can only call this once
    // the reason is because we set the response links here and those can't be edited. we could probably hack around that if we need multi-page.
    if (this.gotPage) { return undefined }
    this.gotPage = true
    return this.model.findAll(R.merge({
      where: this.whereClause(),
      order: this.keys,
      limit: DEFAULT_LIMIT
    }, this.findAllOpts)).then((collection) => {
      if (collection.length >= DEFAULT_LIMIT) {
        // more pages. set the link.
        this.cursor = R.pick(this.keys, R.last(collection))
        this.query.cursor = Buffer.from(JSON.stringify(this.cursor)).toString('base64')
        this.res.links({next: this.url + '?' + querystring.stringify(this.query)})
      }
      return collection
    })
  }

  sendPage() {
    return this.getPage().then(col => this.res.ok(col))
  }
}

module.exports = Cursor
