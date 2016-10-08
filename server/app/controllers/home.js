module.exports = () => ({
  '/': (req, res) => {
    res.ok('hello world')
  },
  'ping': (req, res) => {
    res.ok({ msg: 'pong', time: Date.now() })
  },
})
