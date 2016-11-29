'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'Games',
      'staleAt',
      Sequelize.DATE)
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Games', 'staleAt')
  }
}
