const pg = require('pg')
const client = new pg.Client()

client.connect(function (err) {
  if (err) throw err

  client.query('CREATE TABLE IF NOT EXISTS teams ( name text, id serial NOT NULL, team_id text, division text, deleted_at timestamp without time zone, CONSTRAINT teams_pkey PRIMARY KEY (id)) WITH ( OIDS=FALSE);', function (err, result) {
    if (err) throw err
    client.end(function (err) {
      if (err) throw err
    })
  })
  client.query('CREATE TABLE IF NOT EXISTS games ( id serial NOT NULL, away_team text NOT NULL, home_team text NOT NULL, home_team_score integer, away_team_score integer, created_date timestamp without time zone DEFAULT now(), updated_date timestamp without time zone, deleted_at timestamp without time zone, field integer, game_date_time timestamp without time zone, tournament integer DEFAULT 0, game_number text DEFAULT 0, CONSTRAINT games_pk PRIMARY KEY (id) ) WITH ( OIDS=FALSE );', function (err, result) {
    if (err) throw err
    client.end(function (err) {
      if (err) throw err
    })
  })
  client.query('CREATE OR REPLACE FUNCTION update_at_trigger() RETURNS trigger AS $BODY$BEGIN NEW.updated_date = now(); RETURN NEW; END;$BODY$ LANGUAGE plpgsql VOLATILE COST 100;', function (err, result) {
    if (err) throw err
    client.end(function (err) {
      if (err) throw err
    })
  })
  client.query('CREATE TRIGGER updated_date_trigger BEFORE UPDATE ON games FOR EACH ROW EXECUTE PROCEDURE update_at_trigger();', function (err, result) {
    if (err) throw err
    client.end(function (err) {
      if (err) throw err
    })
  })
})
