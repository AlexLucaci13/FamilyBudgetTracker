const { Pool } = require("pg");

const  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnathorized: true},
    max: 5,
});

async function createDB(){
    await pool.query(`CREATE TABLE transactions (id UUID PRIMARY KEY, type TEXT NOT NULL CHECK (type IN ('income','expense')), amount NUMERIC(12,2) NOT NULL CHECK (amount > 0), category TEXT NOT NULL, description TEXT, date DATE NOT NULL, receipt TEXT)`);
    await pool.query(`CREATE INDEX`);


}

module.exports = { pool, createDB} ;