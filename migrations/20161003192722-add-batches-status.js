'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('Batches', 'status', Sequelize.STRING)
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Batches', 'status');
  }
};
