const Sequelize = require('sequelize')
const models = ['batch', 'facility', 'field', 'game', 'team']

module.exports = {
  provider: 'sequelize',
  multi: true,
  init: (sequelize) => {
    return models.reduce(models, model => {
      models[model] = require(`./imports/${model}`)(sequelize, Sequelize.DataTypes)
      return models
    }, {})
  },
}
