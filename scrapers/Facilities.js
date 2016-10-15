const Database = require('./Database')
const Facilities = [
  {name: 'Utah Soccer', address: '4476 S. Century Drive, Suite B', state: 'UT', city: 'Salt Lake City', zip: 84123, environment: 'Outdoor', image:'https://storage.googleapis.com/soccerlcfacilities/utahSoccer.jpg'},
  {name: 'Lets Play Soccer GV', address: '1194 West 7800 South', state: 'UT', city: 'West Jordan', zip: 84088, environment: 'Indoor', image: 'https://storage.googleapis.com/soccerlcfacilities/letsplay.jpg'},
  {name: 'Sport City', address: '757 W 11400 S', state: 'UT', city: 'Draper', zip: 84020, environment: 'Indoor', image: 'https://storage.googleapis.com/soccerlcfacilities/sportcityindoor.jpg'},
]
Database.initialFacilityInsert(Facilities)
