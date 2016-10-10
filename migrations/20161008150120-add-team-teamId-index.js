'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addIndex('Teams', ['teamId'], {indexName: 'teamId', indicesType: 'UNIQUE'})
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeIndex('Teams', 'teamId');
  }
};
