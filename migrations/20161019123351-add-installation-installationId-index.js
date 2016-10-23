'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addIndex('Installations', ['installationId'], {indexName: 'installationId', indicesType: 'UNIQUE'})
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeIndex('Installations', 'installationId');
  }
};
