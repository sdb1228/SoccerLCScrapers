const Sequelize = require('sequelize')
const imports = ['batch', 'facility', 'field', 'game', 'team']

module.exports = {
  provider: 'sequelize',
  multi: true,
  init: (sequelize) => {
    return imports.reduce(models, model => {
      models[model] = require(`./imports/${model}`)(sequelize, Sequelize.DataTypes)
      return models
    }, {})
  },
}
