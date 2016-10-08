module.exports = () => ({
  '/': {
    get: (req, res) => {
      res.ok('hello world')
    },
  },
  'teams': (req, res) => {
    Models.Team.findAll()
      .then(teams => {
        res.ok(teams)
      })
  },
})
