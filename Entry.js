const schedule = require('node-schedule')
const LetsPlay = require('./LetsPlay')
// const UtahSoccer = require('./UtahSoccer')

schedule.scheduleJob('0 0 */3 * * *', () => {
  LetsPlay.scrape()
})
// UtahSoccer.scrape()
