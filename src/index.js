// src/index.js
require('dotenv').config();

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const pool = require('./config/database');
const profileRoutes = require('./routes/profileRoutes');
const authRoutes = require('./routes/authRoutes');
const { UserModel, createUsersTable } = require('./models/userModel');
const { 
  initializeScheduler, 
  updateAllProfiles, 
  runPythonScraper,
  getNextScheduledRun 
} = require('./services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize database tables
createUsersTable()
  .then(() => console.log('✅ Database tables checked'))
  .catch(err => console.error('❌ Error initializing tables:', err));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// CORS (if needed for frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Routes
app.use('/api/profiles', profileRoutes);
app.use('/api/auth', authRoutes);

// Serve the frontend for any other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check with improved error handling
app.get('/api/health', async (req, res) => {
  try {
    if (!pool || typeof pool.query !== 'function') {
      throw new Error('Database pool is not properly initialized');
    }
    
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows?.[0]?.now || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual update trigger endpoint with improved error handling
app.post('/api/update-profiles', async (req, res) => {
  try {
    if (typeof updateAllProfiles !== 'function') {
      throw new Error('updateAllProfiles function is not properly defined');
    }
    
    await updateAllProfiles();
    res.json({
      success: true,
      message: 'Profile update initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual profile update failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get next scheduled scrape time
app.get('/api/scraper/schedule', (req, res) => {
  try {
    const nextRun = getNextScheduledRun();
    res.json({
      success: true,
      nextScheduledRun: nextRun ? nextRun.toISOString() : null,
      scheduledTime: '00:00 (midnight) daily',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting schedule info:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual scraper trigger endpoint (runs Python scraper only)
app.post('/api/run-scraper', async (req, res) => {
  try {
    if (typeof runPythonScraper !== 'function') {
      throw new Error('runPythonScraper function is not properly defined');
    }
    
    const success = await runPythonScraper();
    
    if (success) {
      res.json({
        success: true,
        message: 'Instagram scraper completed successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Scraper execution failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Manual scraper execution failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize scheduler with safety checks
let scheduler;
try {
  scheduler = initializeScheduler();
  console.log('✅ Scheduler initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize scheduler:', error.message);
}

// Start server with error handling
try {
  const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   - GET    /api/health`);
  console.log(`   - GET    /api/profiles`);
  console.log(`   - GET    /api/profiles/stats`);
  console.log(`   - GET    /api/profiles/top?limit=5`);
  console.log(`   - GET    /api/profiles/:username`);
  console.log(`   - POST   /api/profiles`);
  console.log(`   - PUT    /api/profiles/:username`);
  console.log(`   - DELETE /api/profiles/:username`);
  console.log(`   - POST   /api/update-profiles (manual trigger for full update)`);
  console.log(`   - POST   /api/run-scraper (manual trigger for Python scraper only)`);
  console.log(`   - GET    /api/scraper/schedule (get next scheduled scrape time)`);
  console.log(`   - POST   /api/auth/register`);
  console.log(`   - POST   /api/auth/login`);
  console.log(`   - GET    /api/auth/logout`);
  console.log(`   - GET    /api/auth/profile (protected)`);
  });
  
  // Add graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
    });
  });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
}