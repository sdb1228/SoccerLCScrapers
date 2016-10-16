
module.exports = () => ({
  '/login': {
    post: (req, res, next) => {
      const deviceId = req.body.deviceId

      if (!deviceId) res.badRequest('Missing device id')

      Models.User.findOrCreate({ where: { deviceId } })
        .spread((user, isNew) => {
          // if it's a fresh signup, add it to the correct user group
          //if (result.isNew) {
          //  result.user.addGroup(App.data.preload.group.name.user.id)
          //}

          // other data to pass on login besides user object?
          res.okOrCreated({
            token: Services.jwt.sign(result.user.toJSON())
          }, isNew)
        })
        .catch(next)
    },
  }
})
