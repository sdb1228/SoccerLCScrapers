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
db.Sequelize = Sequelize;

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}
db.sequelize = sequelize;

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

function jsonLog(obj) { console.log(JSON.stringify(obj, null, 2)) }

db.updateIfNull = async(function updateIfNull(model, vals) {
  if (vals) {
    for (const key in vals) {
      // 0 is a useful value. don't overwrite.
      if (!model[key] && model[key] !== 0 && vals[key]) { model[key] = vals[key] }
    }
    await(model.save())
  }
  return model
})

db.upsertFieldByName = async((name, defaults) => {
  // todo: maybe fuzzy match name
  // todo: maybe add field name aliases
  // todo: detect and report conflicting values
  jsonLog({upsertFieldByName: {name: name, defaults: defaults}})
  const [field] = await(db.Field.findOrCreate({where: {name: {$iLike: name}}, defaults: defaults || {name: name}}))
  return await(db.updateIfNull(field, defaults))
})

db.upsertTeamByTeamId = async((teamId, defaults) => {
  // todo: detect and report conflicting values
  jsonLog({upsertTeamByTeamId: {teamId: teamId, defaults: defaults}})
  const [team] = await(db.Team.findOrCreate({where: {teamId: teamId}, defaults: defaults}))
  return await(db.updateIfNull(team, defaults))
})

function intOrNull(from) {
  const res = parseInt(from)
  return isNaN(res) ? null : res
}

db.upsertGame = async((gameData) => {
  jsonLog({upsertGame: gameData})
  // todo: validate gameData. forgetting facilityId is easy.
  const [fieldId, homeTeamId, awayTeamId] = await (db.upsertFieldAndTeamIds(gameData.field, gameData.homeTeamId, gameData.awayTeamId))
  // todo: detect reschedules and/or field changes
  // there are many ways a game could change. we only handle the common cases.

  let game = await(db.Game.findOne({where: {
    homeTeamId: homeTeamId,
    awayTeamId: awayTeamId,
    fieldId: fieldId,
    gameDateTime: gameData.gameDateTime
  }}))
  const homeScore = intOrNull(gameData.homeTeamScore)
  const awayScore = intOrNull(gameData.awayTeamScore)
  if (game) {
    // identical games. touch the batch id.
    // scored games. update the scores, touch the batch id.
    game.lastBatchAt = gameData.batchAt
    await(db.updateIfNull(game, {homeTeamScore: homeScore, awayTeamScore: awayScore}))
    await(game.save())
  } else {
    // todo: detect reschedules
    // new game.
    game = await(db.Game.create({
      facilityId: gameData.facilityId,
      fieldId: fieldId,
      homeTeamId: homeTeamId,
      awayTeamId: awayTeamId,
      gameDateTime: gameData.gameDateTime,
      homeTeamScore: homeScore,
      awayTeamScore: awayScore,
      tournament: gameData.tournament,
      lastBatchAt: gameData.batchAt
    }))
  }
  return game
})

db.upsertFieldAndTeamIds = async((fieldName, homeTeamId, awayTeamId) => {
  let fieldId, homeTeamDbId, awayTeamDbId
  if (fieldName) { fieldId = await(db.upsertFieldByName(fieldName)).id }
  if (homeTeamId) { homeTeamDbId = await(db.upsertTeamByTeamId(homeTeamId)).id }
  if (awayTeamId) { awayTeamDbId = await(db.upsertTeamByTeamId(awayTeamId)).id }
  return [fieldId, homeTeamDbId, awayTeamDbId]
})

module.exports = db;
