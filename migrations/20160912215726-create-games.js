'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('Games', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      awayTeamId: {
        type: Sequelize.INTEGER,
        unique: 'gameCombo',
        references: {
          model: 'Teams',
          key: 'id'
        }
      },
      facilityId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Facilities',
          key: 'id'
        }
      },
      facilityGameId: {
        type: Sequelize.STRING,
      },
      homeTeamId: {
        type: Sequelize.INTEGER,
        unique: 'gameCombo',
        references: {
          model: 'Teams',
          key: 'id'
        }
      },
      awayTeamScore: {
        type: Sequelize.INTEGER
      },
      homeTeamScore: {
        type: Sequelize.INTEGER
      },
      deletedAt: {
        type: Sequelize.DATE
      },
      gameDateTime: {
        type: Sequelize.DATE,
        unique: 'gameCombo'
      },
      fieldId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Fields',
          key: 'id'
        }
      },
      tournament: {
        type: Sequelize.INTEGER
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
    return queryInterface.dropTable('Games');
  }
};
