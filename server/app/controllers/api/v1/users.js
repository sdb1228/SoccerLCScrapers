// todo: move favorites stuff here after we get a real user model
const request = require('superagent')

module.exports = () => ({
  'self/installation': {
    put: (req, res, next) => {
      Promise.coroutine(function* (){
        try {
          let token = req.body.deviceToken
          if (req.body.apnsToken) {
            let apnsRes = yield request
                .post('https://iid.googleapis.com/iid/v1:batchImport')
                .set('Content-Type', 'application/json')
                .set('Authorization', `key=${App.config.services.fcm.serverKey}`)
                .send({
                  application: 'com.burnetttech.SoccerInfo',
                  sandbox: true,
                  apns_tokens: [req.body.apnsToken]
                })
            if (apnsRes.body.results[0].status !== 'OK') {
              throw apnsRes.body
            }
            token = apnsRes.body.results[0].registration_token
          }
          yield Models.Installation.upsert({installationId: req.body.installationId, deviceToken: token})
          res.ok()
        } catch (e) {
          next(e)
        }
      })()
    }
  }
})
