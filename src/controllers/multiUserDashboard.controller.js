// 📁 src/controllers/multiUserDashboard.controller.js
// Multi-User Dashboard Controller
// ==========================================
import { MultiUserDashboardService } from '../services/multiUserDashboardService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const dashboardService = new MultiUserDashboardService();

// 🎯 Get aggregated logs from multiple users
export const getDashboardLogs = async (req, res) => {
  try {
    const { userIds = [], date, includeStats = true, groupBy = 'user' } = req.body;

    console.log(`📊 Dashboard request: ${userIds.length} users specified`);

    const result = await dashboardService.getDashboardLogs(userIds, {
      date,
      includeStats,
      groupBy
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Dashboard logs retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getDashboardLogs:', error);
    res.status(500).json(errorResponse('Failed to retrieve dashboard logs', { 
      message: error.message 
    }));
  }
};

// 🎯 Get all users logs (when no specific users provided)
export const getAllUsersLogs = async (req, res) => {
  try {
    const { date, includeStats = true } = req.query;

    console.log(`🌐 All users dashboard request`);

    const result = await dashboardService.getDashboardLogs([], {
      date,
      includeStats
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('All users logs retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getAllUsersLogs:', error);
    res.status(500).json(errorResponse('Failed to retrieve all users logs', { 
      message: error.message 
    }));
  }
};

// 🎯 Get real-time updates for dashboard (polling endpoint)
export const getDashboardUpdates = async (req, res) => {
  try {
    const { userIds = [], lastUpdateTime, maxLogs = 100 } = req.body;

    console.log(`🔄 Dashboard updates request for ${userIds.length} users`);

    const result = await dashboardService.getDashboardUpdates(userIds, lastUpdateTime, {
      maxLogs
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Dashboard updates retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getDashboardUpdates:', error);
    res.status(500).json(errorResponse('Failed to get dashboard updates', { 
      message: error.message 
    }));
  }
};

// 🎯 Search across multiple users
export const searchAcrossUsers = async (req, res) => {
  try {
    const { userIds = [], searchQuery, date, caseSensitive = false, maxResults = 200 } = req.body;

    if (!searchQuery || searchQuery.length < 2) {
      return res.status(400).json(errorResponse(
        'searchQuery is required and must be at least 2 characters',
        {
          example: {
            userIds: ['john_doe', 'jane_smith'],
            searchQuery: 'error',
            date: '2025-09-01'
          }
        }
      ));
    }

    console.log(`🔍 Cross-user search: "${searchQuery}" in ${userIds.length} users`);

    const result = await dashboardService.searchAcrossUsers(userIds, searchQuery, {
      date,
      caseSensitive,
      maxResults
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Cross-user search completed successfully', result));

  } catch (error) {
    console.error('❌ Error in searchAcrossUsers:', error);
    res.status(500).json(errorResponse('Failed to search across users', { 
      message: error.message 
    }));
  }
};

// 🎯 Get user statistics for dashboard
export const getUserStatistics = async (req, res) => {
  try {
    const { userIds = [] } = req.body;

    console.log(`📈 Statistics request for ${userIds.length} users`);

    const result = await dashboardService.getUserStatistics(userIds);

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('User statistics retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getUserStatistics:', error);
    res.status(500).json(errorResponse('Failed to get user statistics', { 
      message: error.message 
    }));
  }
};

// 🎯 Get specific user logs for dashboard
export const getUserDashboardLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    console.log(`👤 Single user dashboard request: ${userId}`);

    const result = await dashboardService.getUserLogsForDashboard(userId, { date });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('User dashboard logs retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getUserDashboardLogs:', error);
    res.status(500).json(errorResponse('Failed to get user dashboard logs', { 
      message: error.message 
    }));
  }
};

// 🎯 Get dashboard overview/summary
export const getDashboardOverview = async (req, res) => {
  try {
    const { userIds = [] } = req.body;

    console.log(`📋 Dashboard overview request`);

    // Get quick stats without full log content
    const statsResult = await dashboardService.getUserStatistics(userIds);
    
    if (!statsResult.success) {
      return res.status(404).json(errorResponse(statsResult.error, statsResult));
    }

    // Add quick counts
    const overview = {
      ...statsResult.statistics,
      quickStats: {
        totalUsers: statsResult.statistics.overview.totalUsers,
        totalAliases: statsResult.statistics.overview.totalAliases,
        activeUsers: statsResult.statistics.overview.activeUsers,
        mostActiveUser: statsResult.statistics.users.reduce((max, user) => 
          user.totalAccess > (max?.totalAccess || 0) ? user : max, null
        ),
        recentActivity: new Date().toISOString()
      }
    };

    res.json(successResponse('Dashboard overview retrieved successfully', { overview }));

  } catch (error) {
    console.error('❌ Error in getDashboardOverview:', error);
    res.status(500).json(errorResponse('Failed to get dashboard overview', { 
      message: error.message 
    }));
  }
};