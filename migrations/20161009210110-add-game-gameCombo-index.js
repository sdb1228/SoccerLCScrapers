'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addIndex('Games', ['gameDateTime', 'homeTeamId', 'awayTeamId'], {indexName: 'gameCombo', indicesType: 'UNIQUE'})
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeIndex('Games', 'gameCombo');
  }
};
