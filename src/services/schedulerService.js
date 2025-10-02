// src/services/schedulerService.js
const pool = require('../config/database');
const schedule = require('node-schedule');

/**
 * Initialize scheduler for periodic profile updates
 * @returns {object} The scheduler instance
 */
/**
 * Get the next scheduled run time
 * @returns {Date|null} The next scheduled run time or null if not available
 */
const getNextScheduledRun = () => {
  try {
    if (globalScheduler && typeof globalScheduler.nextInvocation === 'function') {
      return globalScheduler.nextInvocation();
    }
    return null;
  } catch (error) {
    console.error('Error getting next scheduled run:', error.message);
    return null;
  }
};

// Global reference to the scheduler
let globalScheduler = null;

const initializeScheduler = () => {
  try {
    // Schedule job to run once a day at 00:00 (midnight)
    const scheduler = schedule.scheduleJob('0 0 * * *', async () => {
      console.log('💫 Running daily profile update:', new Date().toISOString());
      try {
        await updateAllProfiles();
        console.log('✅ Daily profile update completed successfully');
      } catch (error) {
        console.error('❌ Daily profile update failed:', error.message);
      }
    });
    
    console.log('⏰ Daily profile update scheduled for midnight (00:00)');
    
    // Save scheduler reference globally
    globalScheduler = scheduler;
    
    return scheduler;
  } catch (error) {
    console.error('❌ Error initializing scheduler:', error.message);
    // Return a dummy scheduler to prevent crashes
    globalScheduler = {
      cancelNext: () => {},
      cancel: () => {},
      nextInvocation: () => null
    };
    return globalScheduler;
  }
};

/**
 * Update all Instagram profiles in the database
 */
const updateAllProfiles = async () => {
  try {
    console.log('🚀 Starting update for all Instagram profiles...');
    
    // First run the Python scraper to fetch latest data
    const scraperSuccess = await runPythonScraper();
    
    if (!scraperSuccess) {
      console.warn('⚠️ Python scraper failed, falling back to database update only');
    }
    
    // Get all profiles from database
    const result = await pool.query('SELECT username FROM profiles');
    
    if (!result || !result.rows) {
      console.log('ℹ️ No profiles found to update in database');
      return;
    }

    console.log(`📊 Updating ${result.rows.length} profiles in database...`);
    
    // Process each profile update sequentially
    for (const profile of result.rows) {
      await updateProfile(profile.username);
    }
    
    console.log('✅ All profile updates completed');
  } catch (error) {
    console.error('❌ Error updating profiles:', error.message);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Update a single Instagram profile
 * @param {string} username The Instagram username to update
 */
const updateProfile = async (username) => {
  try {
    console.log(`🔄 Updating profile: ${username}`);
    
    // Update the last_updated timestamp 
    await pool.query(
      'UPDATE profiles SET last_updated = NOW() WHERE username = $1',
      [username]
    );
    
    console.log(`✅ Profile updated: ${username}`);
  } catch (error) {
    console.error(`❌ Error updating profile ${username}:`, error.message);
    // Don't throw, so other profiles can still be updated
  }
};

/**
 * Execute the Python scraper to update all Instagram profiles
 * @returns {Promise<boolean>} Whether the scraping was successful
 */
const runPythonScraper = async () => {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    
    // Path to Python script (relative to project root)
    const pythonScript = path.join(__dirname, '../../python-scraper/scraper.py');
    
    console.log('🐍 Running Python Instagram scraper...');
    
    return new Promise((resolve, reject) => {
      // Execute Python script
      exec(`python "${pythonScript}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Python scraper execution error: ${error.message}`);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.error(`⚠️ Python scraper stderr: ${stderr}`);
        }
        
        console.log('📊 Python scraper output:');
        console.log(stdout);
        console.log('✅ Python scraper completed successfully');
        resolve(true);
      });
    });
  } catch (error) {
    console.error('❌ Failed to run Python scraper:', error.message);
    return false;
  }
};

module.exports = { 
  initializeScheduler, 
  updateAllProfiles, 
  runPythonScraper,
  getNextScheduledRun
};