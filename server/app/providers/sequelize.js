const Sequelize = require('sequelize')

const SequelizeProvider = {

  init: (config) => {
    const sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.hostname,
      dialect: config.dialect,
      logging: Log.trace.bind(Log),
      pool: {
        max: 5,
        min: 0,
        idle: 10000,
      },
    })

    return sequelize
  },

  reset: (sequelize, doneCallback) => {
    sequelize.sync({ force: true })
      .then(() => { /* Log.info('sequelize synced') */ doneCallback() })
      .catch(err => {
        Log.error('sequelize sync error', err)
        doneCallback(err)
      })
  },

  // modelsReadyHook: (sequelize, doneCallback) => {
    // sequelize.sync({ force: false })
    //   .then(() => { /* Log.info('sequelize synced') */ doneCallback() })
    //   .catch(err => {
    //     Log.error('sequelize sync error', err)
    //     doneCallback(err)
    //   })
  // },
}

module.exports = SequelizeProvider
