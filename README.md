# SoccerLCScrapers

Soccer LC Scrapers contains all the scrapers for the facilities supported currently on the SoccerLC app.

## Getting Started
To run the scrapers the most common way is to use [Docker] [df1]

If you are running this on a mac and never set up docker before, you will need [Dinghy] [dghy].  Follow the set up guides there and you should be almost ready to go!

After having docker installed we use docker-compose version 1.7.1 to build/run the scrapers.  You will first need to run:
```
docker-compose build
```
From there you will need to migrate your docker database so you can have all the tables.
```
docker-compose run --rm scrapers node_modules/.bin/sequelize db:migrate
```
Sometimes this will fail the first time because the database container isn't running.  You have 2 options 1 run the database container
before you run the migrations, or just run that command above twice and it will work.

After this you need to run the facilities before you can scrape anything.  To do this run

```
docker-compose run --rm scrapers node Facilities.js
```

After that you are ready to run the scrapers
```
docker-compose run --rm scrapers
or
docker-compose run scrapers
```
You can then check out the database and its contents by doing
```
docker exec -it <postgres containerid> bash
```
you can find the container id by doing
```
docker ps
```
once in the container you will need to run
```
psql -U SoccerLC
```
you can then list all the tables by doing
```
\dt
```
and run any queries with normal sql.  Check the guide on more postgres stuff by visiting the [postgres website] [pgweb]

### Locally

If you refuse to conform to the standard of docker ( I know I understand it can be frustrating sometimes)  Then what you will need to do is install node 6 and postgres.  Once both are installed you will need to create a postgres database server with the same configureation found in the docker-compose.yml/migrations.js.  In reality you should just plan on using docker but if you don't submit an issue and I can update the docs to accomadate your lack of motivation to move to a more standard way of life.

### How to deploy

To deploy to production you will need to set up the github live branch.  To do this add the remote like so:

```
git remote add live ssh://root@192.241.214.32/var/scraperRepo/scraper.git
```

from there you will actually deploy by running

```
git push live master
```

   [dghy]: https://github.com/codekitchen/dinghy
   [pgweb]: https://www.postgresql.org/
   [df1]: https://www.docker.com/

## Team Updating

We always have a teamId and facilityId. Sometimes we also have a team name and division. Currently the teamId is the only thing that really matters. Null DB values are always set from non-null scraped values. Conflicting division might need to be reported for human review and does need to be set to the most recent value scraped (note: _not_ neccessarily the most recently scraped value. gameDateTime might need to be checked). Conflicting teamName is reported for human review.

## Field Updating

We always have a fieldName. Sometimes we also have address data. Null DB values are always set from non-null scraped values. Conflicting address data is reported for human review. We'll need field name aliases at some point I'm sure.

## Game Updating

There isn't a foolproof way to know which game is which between scrapes. We need to know that so that we can associate data (e.g. comments, notifications) to them. Here is how we determine how to update our game db.

Every scraped game needs to be matched with exactly one DB game. The DB game can be new or preexisting.

We try to minimize changed DB games. If an ambiguity arises where we could have two slightly different games or one identical game and one significantly changed game, we prefer to have one identical game.

Data is "null" when the scraped data and the DB data are both null.

Data is "identical" or "same" when the scraped data equals the DB data, null or not.

Data is "conflicting" when the scraped data is different from the DB data and both are non-null.

Data is "erased" when the scraped data is null and the DB data is non-null.

Data is "set" when the scraped data is non-null and the DB data is null.

"Swappable" is used when the home and away team can be swapped and still be considered identical. Scores must be swapped also.

What do we do if we have a DB game with teams, another with fieldtime, and a scraped with both? Merge them?

Should we be picky with the data we import? Just ignore games with scores without teams and such?

### Checks
These checks proceed in order, i.e. all games are checked for identical versions, then all are checked for scoring. Once a scraped game has been matched to a DB game, both are removed from consideration for further checks.

Invalid: Null scraped field, time, and teams.
Invalid: Non-null score for null team.
Obviously Valid: Non-null field, time, teams, no scores.
Obviously Valid and Complete: Non-null field, time, teams, scores.

Identical: Same field, time, home team, away team, and scores.
Scored: Same field, time, home team, away team. Set or Identical scores.
Score Update: Same field, time, home team, away team. Conflicting scores.
Team Set: Same field, time. No scores. Set or Identical teams.
(maybe new game)Team Change: Same field, time, home or away team. No scores. Other team conflicting.
(Unscored is probably a new game, not unscoring an existing game. This check is considered later.)
Some combinations to think about: Scored and Team Set, Score Update and Team Change.
Scheduled: Same teams (swappable). No scores. Non-conflicting non-null scraped field and/or time.
Reschedule: Same teams (swappable). No scores. Conflicting field and/or time. (should time be similar? Partial Unschedule when only one conflicts?)
Unscheduled: Same teams (swappable). No scores. Erased field and time.
Archived: Unmatched DB games. Non-null field, time, teams, scores.
Cancelled: Unmatched DB games. Non-null field and/or time.
Silent Delete: Unmatched DB games. Null field and time.
New Game: Unmatched scraped game.
