// This script is for verifying database connectivity in a Node.js environment
// Usage: node test-db.js

const { Pool } = require('pg');

const CONNECTION_STRING = "postgresql://neondb_owner:npg_0B8kPWfrEjqV@ep-cold-wildflower-a1bj11k6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: {
      rejectUnauthorized: false
  }
});

async function run() {
  console.log('Connecting to NeonDB...');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected successfully!');
    console.log('Current Database Time:', result.rows[0]);
    client.release();
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    await pool.end();
  }
}

run();