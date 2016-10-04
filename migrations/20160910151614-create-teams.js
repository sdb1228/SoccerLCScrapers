'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('Teams', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      batchId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        unique: 'batchTeam',
        references: {
          model: 'Batches',
          key: 'id'
        }
      },
      name: {
        type: Sequelize.STRING
      },
      teamId: {
        type: Sequelize.STRING,
        unique: 'batchTeam'
      },
      division: {
        type: Sequelize.STRING
      },
      facilityId: {
        type: Sequelize.INTEGER
      },
      deletedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('Teams');
  }
};
