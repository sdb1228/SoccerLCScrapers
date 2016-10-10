'use strict';
const async = require('asyncawait/async')
const await = require('asyncawait/await')

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.json')[env];
var db        = {};

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

function jsonLog(obj) { console.log(JSON.stringify(obj, null, 2)) }

db.findOrCreateFieldByName = async((name, defaults) => {
  jsonLog({findOrCreateFieldByName: {name: name, defaults: defaults}})
  return await(db.Field.findOrCreate({where: {name: {$iLike: name}}, defaults: defaults || {name: name}}))
  // todo: maybe update address
  // todo: maybe fuzzy match name
  // tood: maybe add field name aliases
})

db.findOrCreateTeamByTeamId = async((teamId, defaults) => {
  jsonLog({findOrCreateTeamByTeamId: {teamId: teamId, defaults: defaults}})
  return await(db.Team.findOrCreate({where: {teamId: teamId}, defaults: defaults}))
  // todo: maybe update division
})

db.findOrCreateGame = async((gameData) => {
  jsonLog({findOrCreateGame: gameData})
  return await(db.Game.findOrCreate({where: gameData}))
})

db.findOrCreateFieldAndTeamIds = async((fieldName, homeTeamId, awayTeamId) => {
  let fieldId, homeTeamDbId, awayTeamDbId
  if (fieldName) { fieldId = await(db.findOrCreateFieldByName(fieldName))[0].id }
  if (homeTeamId) { homeTeamDbId = await(db.findOrCreateTeamByTeamId(homeTeamId))[0].id }
  if (awayTeamId) { awayTeamDbId = await(db.findOrCreateTeamByTeamId(awayTeamId))[0].id }
  return [fieldId, homeTeamDbId, awayTeamDbId]
})

module.exports = db;
