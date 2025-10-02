// src/controllers/profileController.js
const pool = require('../config/database');

// Get all profiles with optional sorting and filtering
exports.getAllProfiles = async (req, res) => {
  try {
    const { sort = 'followers', order = 'desc', search, limit } = req.query;
    
    // Validate sort field
    const validSortFields = ['username', 'followers', 'following', 'posts_count', 'engagement', 'last_updated'];
    const sortField = validSortFields.includes(sort) ? sort : 'followers';
    
    // Validate sort order
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    // Build the query
    let query = 'SELECT * FROM profiles';
    const queryParams = [];
    
    // Add search filter if provided
    if (search) {
      query += ' WHERE username ILIKE $1';
      queryParams.push(`%${search}%`);
    }
    
    // Add sorting
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    
    // Add limit if provided
    if (limit && !isNaN(parseInt(limit))) {
      query += ' LIMIT $' + (queryParams.length + 1);
      queryParams.push(parseInt(limit));
    }
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single profile by username
exports.getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM profiles WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create or update profile
exports.upsertProfile = async (req, res) => {
  try {
    const { username, followers, following, posts_count, engagement } = req.body;
    
    // Validation
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO profiles (username, followers, following, posts_count, engagement, last_updated)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (username) 
      DO UPDATE SET
        followers = EXCLUDED.followers,
        following = EXCLUDED.following,
        posts_count = EXCLUDED.posts_count,
        engagement = EXCLUDED.engagement,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *
    `, [username, followers || 0, following || 0, posts_count || 0, engagement || 0]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { followers, following, posts_count, engagement } = req.body;
    
    const result = await pool.query(`
      UPDATE profiles 
      SET 
        followers = COALESCE($2, followers),
        following = COALESCE($3, following),
        posts_count = COALESCE($4, posts_count),
        engagement = COALESCE($5, engagement),
        last_updated = CURRENT_TIMESTAMP
      WHERE username = $1
      RETURNING *
    `, [username, followers, following, posts_count, engagement]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    const result = await pool.query(
      'DELETE FROM profiles WHERE username = $1 RETURNING *',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get top profiles with metric selection
exports.getTopProfiles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const metric = req.query.metric || 'followers';
    
    // Validate metric
    const validMetrics = ['followers', 'following', 'posts_count', 'engagement'];
    const sortMetric = validMetrics.includes(metric) ? metric : 'followers';
    
    const result = await pool.query(`
      SELECT * FROM profiles 
      ORDER BY ${sortMetric} DESC 
      LIMIT $1
    `, [limit]);
    
    res.json({
      success: true,
      count: result.rows.length,
      metric: sortMetric,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get leaderboard data
exports.getLeaderboard = async (req, res) => {
  try {
    // Get profiles sorted by followers
    const profiles = await pool.query(`
      SELECT * FROM profiles 
      ORDER BY followers DESC
    `);
    
    // Get top 5 by followers
    const topFollowers = await pool.query(`
      SELECT username, followers 
      FROM profiles 
      ORDER BY followers DESC 
      LIMIT 5
    `);
    
    // Get top 5 by posts
    const topPosts = await pool.query(`
      SELECT username, posts_count 
      FROM profiles 
      ORDER BY posts_count DESC 
      LIMIT 5
    `);
    
    // Get summary stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_profiles,
        SUM(followers) as total_followers,
        SUM(following) as total_following,
        SUM(posts_count) as total_posts,
        AVG(followers) as avg_followers,
        AVG(posts_count) as avg_posts
      FROM profiles
    `);
    
    res.json({
      success: true,
      profiles: profiles.rows,
      topFollowers: topFollowers.rows,
      topPosts: topPosts.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get profiles with high engagement
exports.getHighEngagementProfiles = async (req, res) => {
  try {
    const minEngagement = parseFloat(req.query.min) || 5.0;
    
    const result = await pool.query(`
      SELECT * FROM profiles 
      WHERE engagement >= $1
      ORDER BY engagement DESC
    `, [minEngagement]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_profiles,
        SUM(followers) as total_followers,
        AVG(followers) as avg_followers,
        AVG(engagement) as avg_engagement,
        MAX(followers) as max_followers,
        MIN(followers) as min_followers
      FROM profiles
    `);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};