const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

const dbPath = path.join(__dirname, 'covid19India.db')
let db

app.use(express.json())

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3001, () => {
      console.log('Server Running at http://localhost:3001/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDbObjectResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
// API 1
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT 
      *
    FROM 
      state;`
  const statesArray = await db.all(getStatesQuery)
  response.send(
    statesArray.map(eachState => convertDbObjectResponseObject(eachState)),
  )
})

// API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT 
      *
    FROM 
      state
    WHERE
      state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  response.send(state)
})

// API 3
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const insertDistrictQuery = `
   INSERT INTO 
     district (district_name, state_id, cases, cured, active, deaths)
   VALUES
     ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`
  await db.run(insertDistrictQuery)
  response.send('District Successfully Added')
})

const convertDbDistrictObjectResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// API 4
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT 
      *
    FROM 
      district
    WHERE
      district_id = ${districtId};`
  const districtArray = await db.get(getDistrictQuery)
  response.send(
    districtArray.map(eachDistrict =>
      convertDbDistrictObjectResponseObject(eachDistrict),
    ),
  )
})

// API 5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

// API 6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
   UPDATE
     district
   SET
     district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     cured = ${cured},
     active = ${active},
     deaths = ${deaths}
   WHERE
     district_id = ${districtId};`
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

// API 7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
    SELECT 
      SUM(cases) as total_cases,
      SUM(cured) as total_cured,
      SUM(active) as total_active,
      SUM(deaths) as total_deaths
    FROM 
      district
    WHERE
      state_id = ${stateId};`
  const stats = await db.get(getStateStatsQuery)

  response.send({
    totalCases: stats.total_cases,
    totalCured: stats.total_cured,
    totalActive: stats.total_active,
    totalDeaths: stats.total_deaths,
  })
})

// API 8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictNameQuery = `
    SELECT 
      state_id
    FROM 
      district 
    WHERE
      district_id = ${districtId};`
  const getDistrictNameQueryResponse = await db.get(getDistrictNameQuery)

  const getStateNameQuery = `
  SELECT
    state_name AS stateName
  FROM 
    state
  WHERE
    state_id = ${getDistrictNameQueryResponse.state_id};`
  const getStateNameQueryResponse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
})

module.exports = app
