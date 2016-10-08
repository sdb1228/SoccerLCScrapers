'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addIndex('Teams', ['batchId', 'teamId'], {indexName: 'batchTeam', indicesType: 'UNIQUE'})
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeIndex('Teams', 'batchTeam');
  }
};
