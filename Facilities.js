const Database = require('./Database')
const Facilities = [
  {name: 'Utah Soccer', address: '4476 S. Century Drive, Suite B', state: 'UT', city: 'Salt Lake City', zip: 84123},
  {name: 'Lets Play Soccer GV', address: '1194 West 7800 South', state: 'UT', city: 'West Jordan', zip: 84088},
]
Database.initialFacilityInsert(Facilities)