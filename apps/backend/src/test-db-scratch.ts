import { Pool } from 'pg';

async function testConnection() {
  const connectionString = "postgresql://neondb_owner:npg_wVIj8moE4ZWu@ep-late-morning-aoi3d6gc.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
  console.log('Connecting to database...');
  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful! Current time:', res.rows[0]);
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    console.log('Tables in public schema:', tables.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
