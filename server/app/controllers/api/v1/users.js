// todo: move favorites stuff here after we get a real user model

module.exports = () => ({
  'self/installation': {
    put: (req, res, next) => {
      Models.Installation.upsert({installationId: req.body.installationId, deviceToken: req.body.deviceToken}).then(() => res.ok()).catch(next)
    }
  }
})
