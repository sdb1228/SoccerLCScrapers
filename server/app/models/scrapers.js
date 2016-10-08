const Sequelize = require('sequelize')
const models = ['batch', 'facility', 'field', 'game', 'team']

module.exports = {
  provider: 'sequelize',
  multi: true,
  init: (sequelize) => models.map(model => {
    require(`./imports/${model}`)(sequelize, Sequelize.DataTypes)
  }),
}
