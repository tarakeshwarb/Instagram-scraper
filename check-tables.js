// check-tables.js
require('dotenv').config();
const { Pool } = require('pg');

// Create connection pool from .env variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkTables() {
  try {
    console.log('Connecting to database:', process.env.DB_NAME);
    
    // List all tables in the public schema
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nTables in database:');
    if (res.rows.length === 0) {
      console.log('No tables found');
    } else {
      res.rows.forEach(row => console.log('- ' + row.table_name));
    }
    
    // Check if users table exists
    const usersTable = await pool.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('\nUsers table exists:', usersTable.rows[0].exists);
    
    if (usersTable.rows[0].exists) {
      // Count users
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      console.log('Number of users:', userCount.rows[0].count);
      
      // List users
      const users = await pool.query('SELECT id, username, email, role FROM users');
      console.log('\nUsers:');
      users.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTables();