const sequelize = Models.Game.sequelize
const FCM = require('fcm-node')
const fcm = new FCM(App.config.services.fcm.serverKey)
const sendMessage = Promise.promisify(fcm.send, {context: fcm})

module.exports = () => ({
  'push': {
    post: (req, res, next) => {
      Models.Installation.findOne({where: {installationId: req.body.installationId}}).then((installation) => sendMessage(Object.assign({
        to: installation.deviceToken,
        priority: 'high'
      }, req.body.payload || {notification: {title: 'Test Title', body: 'Test Body'}}))).then(() => res.ok()).catch(next)
    }
  }
})
