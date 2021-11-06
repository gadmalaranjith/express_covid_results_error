const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const app = express();

const dbPath = path.join(__dirname, "covid19India.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
//Get all states
app.get("/states/", async (require, response) => {
  const getStatesDetails = `
    SELECT * FROM state;`;
  const statesArray = await db.all(getStatesDetails);
  response.send(statesArray);
});

//Get state id
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetails = `
    SELECT *
    FROM state
    WHERE 
        state_id=${stateId};`;
  const stateArray = await db.get(getStateDetails);
  response.send(stateArray);
});

//get districts
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT *
    FROM district
    WHERE 
        district_id=${districtId};`;
  const districtArray = await db.get(getDistrictDetails);
  response.send(districtArray);
});
//create districts
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//get districts
app.get("/districts/", async (request, response) => {
  const getDistrictsDetails = `
    SELECT *
    FROM district;`;
  const districtsArray = await db.get(getDistrictsDetails);
  response.send(districtsArray);
});
//delete district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM
    district
    WHERE
    district_id=${districtId};`;
  await db.get(deleteDistrict);
  response.send("District Removed");
});

//put district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictDetails = `
    UPDATE 
        district
    SET
        "district_name"='${districtName}',
        "state_id"=${stateId},
        "cases"=${cases},
        "cured"=${cured},
        "active"=${active},
        "deaths"=${deaths}
    WHERE 
        district_id=${districtId};`;
  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//states stats

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesStatsDetails = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM
        district
    WHERE
        state_id=${stateId};`;
  const stats = await db.get(getStatesStatsDetails);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//district Id details

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameDetails = `
        SELECT
            state_name
        FROM
            district
        NATURAL JOIN
            state
        WHERE
            district_id=${districtId};`;
  const state = await db.get(getStateNameDetails);
  response.send({ stateName: state.state_name });
});
module.exports = app;
