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

If you refuse to conform to the standard of docker ( I know I understand it can be frusterating sometimes)  Then what you will need to do is install node 6 and postgres.  Once both are installed you will need to create a postgres database server with the same configureation found in the docker-compose.yml/migrations.js.  In reality you should just plan on using docker but if you don't submit an issue and I can update the docs to accomadate your lack of motivation to move to a more standard way of life.

   [dghy]: https://github.com/codekitchen/dinghy
   [pgweb]: https://www.postgresql.org/
   [df1]: https://www.docker.com/

