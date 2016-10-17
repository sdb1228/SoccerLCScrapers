const Sequelize = require('sequelize')
const scraperModels = ['Facility', 'Field', 'Game', 'Team', 'FavoriteTeam']

module.exports = {
  provider: 'sequelize',
  multi: true,
  init: (sequelize) => {
    const models = scraperModels.reduce((models, model) => {
      models[model] = require(`./imports/${model}`)(sequelize, Sequelize.DataTypes)
      return models
    }, {})
    for (let modelName in models) {
      const model = models[modelName]
      if (model.associate) model.associate(models)
    }
    return models
  },
}
