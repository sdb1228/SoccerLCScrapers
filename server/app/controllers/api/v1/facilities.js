const async = require('asyncawait/async')
const await = require('asyncawait/await')

module.exports = () => ({
  '/': {
    get: (req, res, next) => {
      async(() => {
        try {
          const limit = Math.max(100, Math.min(1, parseInt(req.params.limit) || 50))
          if (req.query.cursor) {
            console.log(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            const cursor = JSON.parse(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
          }
          const facilities = await(Models.Facility.findAll({
            order: ['name', 'id'],
            limit,
          }))
          if (facilities.length >= limit) {
            // more pages. add pagination headers.
            const [fullUrl] = (req.protocol + '://' + req.get('host') + req.originalUrl).split('?') // take off the query string. todo: don't
            const lastFacility = facilities[facilities.length - 1]
            const cursor = Buffer.from(JSON.stringify({name: lastFacility.name})).toString('base64')
            const queryString = `cursor=${cursor}`
            res.set('Link', `<${fullUrl}?${queryString}>; rel="next"`)
          }
          res.ok(facilities)
        } catch(e) {
          next(e)
        }
      })()
    },
  },

  ':environment': {
    get: (req, res, next) => {
      async(() => {
        try {
          const limit = Math.max(100, Math.min(1, parseInt(req.params.limit) || 50))
          let whereClause = {environment: req.params.environment}
          if (req.query.cursor) {
            console.log(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            const cursor = JSON.parse(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            whereClause = {
              $and: [whereClause,
                {$or: [{name: {$gt: cursor.name}}, {name: cursor.name}]}
              ]
            }
          }
          const facilities = await(Models.Facility.findAll({
            where: whereClause,
            order: ['name', 'id'],
            limit}))
          if (facilities.length >= limit) {
            // more pages. add pagination headers.
            const [fullUrl] = (req.protocol + '://' + req.get('host') + req.originalUrl).split('?') // take off the query string. todo: don't
            const lastFacility = facilities[facilities.length - 1]
            const cursor = Buffer.from(JSON.stringify({name: lastFacility.name})).toString('base64')
            const queryString = `cursor=${cursor}`
            res.set('Link', `<${fullUrl}?${queryString}>; rel="next"`)
          }
          res.ok(facilities)
        } catch(e) {
          next(e)
        }
      })()
    }
  },

  ':facility/teams': {
    get: (req, res, next) => {
      async(() => {
        try {
          const limit = Math.max(100, Math.min(1, parseInt(req.params.limit) || 50))
          let whereClause = {facilityId: req.params.facility}
          if (req.query.cursor) {
            console.log(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            const cursor = JSON.parse(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            whereClause = {
              $and: [whereClause,
                     {$or: [{name: {$gt: cursor.name}}, {name: cursor.name, teamId: {$gt: cursor.teamId}}]}
                    ]
            }
          }
          const teams = await(Models.Team.findAll({
            where: whereClause,
            order: ['name', 'teamId', 'id'],
            limit}))
          if (teams.length >= limit) {
            // more pages. add pagination headers.
            const [fullUrl] = (req.protocol + '://' + req.get('host') + req.originalUrl).split('?') // take off the query string. todo: don't
            const lastTeam = teams[teams.length - 1]
            const cursor = Buffer.from(JSON.stringify({name: lastTeam.name, teamId: lastTeam.teamId})).toString('base64')
            const queryString = `cursor=${cursor}`
            res.set('Link', `<${fullUrl}?${queryString}>; rel="next"`)
          }
          res.ok(teams)
        } catch(e) {
          next(e)
        }
      })()
    }
  },

  ':facility/games/today': {
    get: (req, res, next) => {
      async(() => {
        try {
          const limit = Math.max(100, Math.min(1, parseInt(req.params.limit) || 50))
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000))
          let whereClause = {
            facilityId: req.params.facility,
            gameDateTime: { $gte: today, $lt: tomorrow }
          }
          if (req.query.cursor) {
            console.log(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            const cursor = JSON.parse(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            whereClause = {
              $and: [whereClause,
                     {$or: [{name: {$gt: cursor.name}}, {gameId: {$gt: cursor.gameId}}]}
                    ]
            }
          }
          const games = await(Models.Game.findAll({
            where: whereClause,
            order: ['gameDateTime', 'facilityId', 'id'],
            limit,
          }))
          if (games.length >= limit) {
            // more pages. add pagination headers.
            const [fullUrl] = (req.protocol + '://' + req.get('host') + req.originalUrl).split('?') // take off the query string. todo: don't
            const lastGame = games[games.length - 1]
            const cursor = Buffer.from(JSON.stringify({gameId: lastGame.gameId})).toString('base64')
            const queryString = `cursor=${cursor}`
            res.set('Link', `<${fullUrl}?${queryString}>; rel="next"`)
          }
          res.ok(games)
        } catch(e) {
          next(e)
        }
      })()
    }
  },

  ':facility/games/tomorrow': {
    get: (req, res, next) => {
      async(() => {
        try {
          const limit = Math.max(100, Math.min(1, parseInt(req.params.limit) || 50))
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000))
          const dayAfter = new Date(tomorrow.getTime() + (24 * 60 * 60 * 1000))
          let whereClause = {
            facilityId: req.params.facility,
            gameDateTime: { $gte: tomorrow, $lt: dayAfter }
          }
          if (req.query.cursor) {
            console.log(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            const cursor = JSON.parse(Buffer.from(req.query.cursor, 'base64').toString('utf-8'))
            whereClause = {
              $and: [whereClause,
                     {$or: [{name: {$gt: cursor.name}}, {gameId: {$gt: cursor.gameId}}]}
                    ]
            }
          }
          const games = await(Models.Game.findAll({
            where: whereClause,
            order: ['gameDateTime', 'facilityId', 'id'],
            limit,
          }))
          if (games.length >= limit) {
            // more pages. add pagination headers.
            const [fullUrl] = (req.protocol + '://' + req.get('host') + req.originalUrl).split('?') // take off the query string. todo: don't
            const lastGame = games[games.length - 1]
            const cursor = Buffer.from(JSON.stringify({gameId: lastGame.gameId})).toString('base64')
            const queryString = `cursor=${cursor}`
            res.set('Link', `<${fullUrl}?${queryString}>; rel="next"`)
          }
          res.ok(games)
        } catch(e) {
          next(e)
        }
      })()
    }
  },

})
