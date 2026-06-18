const pool = require('./pool');

async function getMatch(fixtureID){
    const result = await pool.query(
        //use a parameterized query to prevent SQL injection
        'SELECT * FROM matches WHERE fixture_id = $1',
        // array of values to be substituted for the placeholders in the query
        // here we only have one value being inserted for $1
        [fixtureID]
    );
    // each match id is unique, so should return one match or undefined if match not in db
    return result.rows[0];
}

