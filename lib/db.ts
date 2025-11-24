import { Pool } from '@neondatabase/serverless';

// Direct connection string for browser environment
// Using the provided connection string from the user
const connectionString = "postgresql://neondb_owner:npg_0B8kPWfrEjqV@ep-cold-wildflower-a1bj11k6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString,
});

export default pool;