// src/models/userModel.js
const { Pool } = require('pg');
const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Create users table if it doesn't exist
const createUsersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    console.log('✅ Users table checked/created');
    
    // Check if admin user exists, create if not
    const adminExists = await pool.query(
      'SELECT * FROM users WHERE username = $1', 
      ['admin']
    );
    
    if (adminExists.rows.length === 0) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@example.com', hashedPassword, 'admin']
      );
      console.log('✅ Default admin user created');
    }
  } catch (error) {
    console.error('Error setting up users table:', error);
  }
};

// User operations
const UserModel = {
  findByUsername: async (username) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  findByEmail: async (email) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  create: async (userData) => {
    try {
      const { username, email, password, role = 'user' } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, email, hashedPassword, role]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  updateLastLogin: async (userId) => {
    try {
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  },
  
  getAllUsers: async () => {
    try {
      const result = await pool.query(
        'SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = {
  UserModel,
  createUsersTable
};