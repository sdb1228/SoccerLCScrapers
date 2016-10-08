const Sequelize = require('sequelize')
const scraperModels = ['batch', 'facility', 'field', 'game', 'team']

module.exports = {
  provider: 'sequelize',
  multi: true,
  init: (sequelize) => {
    return scraperModels.reduce((models, model) => {
      models[model] = require(`./imports/${model}`)(sequelize, Sequelize.DataTypes)
      return models
    }, {})
  },
}
