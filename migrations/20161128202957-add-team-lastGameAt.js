'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'Teams',
      'lastGameAt',
      Sequelize.DATE)
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Teams', 'lastGameAt')
  }
}
