const Slack = require('node-slack')
const slack = new Slack('https://hooks.slack.com/services/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')
const channel = '#error_reports'
const botUsername = 'Server Bot'

module.exports = () => ({
  errors: {
    post: (req, res, next) => {
      if (req.body.message) {
        if (process.env.NODE_ENV === 'production') {
          slack.send({
            text: req.body.message,
            channel: channel,
            username: botUsername
          })
        } else {
          console.log(req.body.message)
        }
        res.ok()
      } else {
        res.badRequest('missing message')
      }
    }
  }
})
