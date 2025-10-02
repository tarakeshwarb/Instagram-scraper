// src/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Get all profiles
router.get('/', profileController.getAllProfiles);

// Get dashboard statistics
router.get('/stats', profileController.getDashboardStats);

// Get leaderboard data
router.get('/leaderboard', profileController.getLeaderboard);

// Get top profiles
router.get('/top', profileController.getTopProfiles);

// Get high engagement profiles
router.get('/high-engagement', profileController.getHighEngagementProfiles);

// Get single profile
router.get('/:username', profileController.getProfileByUsername);

// Create or update profile (upsert) - protected
router.post('/', protect, profileController.upsertProfile);

// Update profile - protected
router.put('/:username', protect, profileController.updateProfile);

// Delete profile - protected, admin only
router.delete('/:username', protect, restrictTo('admin'), profileController.deleteProfile);

module.exports = router;