// 📁 src/routes/index.routes.js - UPDATED WITH MULTI-USER SUPPORT
// ==========================================
import express from 'express';
import aliasLogsRoutes from './aliasLogs.routes.js';                    // Original single user
import multiUserDashboardRoutes from './multiUserDashboard.routes.js'; // 🆕 Multi-user dashboard
import logAggregatorRoutes from './logAggregator.routes.js';            // 🆕 Advanced aggregation

const router = express.Router();

// ==========================================
// SINGLE USER ROUTES (Original)
// ==========================================
router.use('/alias-logs', aliasLogsRoutes);
// Original endpoints for single user operations

// ==========================================
// 🆕 MULTI-USER DASHBOARD ROUTES
// ==========================================
router.use('/dashboard', multiUserDashboardRoutes);
// Multi-user dashboard for combined view

// ==========================================
// 🆕 ADVANCED LOG AGGREGATION ROUTES
// ==========================================
router.use('/aggregator', logAggregatorRoutes);
// Advanced aggregation with filtering, grouping, real-time

// ==========================================
// SYSTEM ENDPOINTS
// ==========================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Multi-User Log Analyzer',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    uptime: process.uptime(),
    features: {
      singleUser: true,
      multiUser: true,
      dashboard: true,
      aggregation: true,
      realtime: true
    }
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'Multi-User Log Analyzer',
    version: '3.0.0',
    description: 'Advanced log analysis system with multi-user dashboard support',
    features: [
      'Single user aliases (original)',
      'Multi-user dashboard',
      'Advanced log aggregation', 
      'Real-time log streaming',
      'Cross-user search',
      'Advanced filtering & grouping',
      'Caching & performance optimization'
    ],
    endpoints: {
      // Original Single User
      singleUser: {
        createAlias: 'POST /api/alias-logs/alias',
        getUserLogs: 'GET /api/alias-logs/user/{userId}/alias/{aliasName}',
        getAllUserLogs: 'GET /api/alias-logs/user/{userId}/all'
      },
      
      // 🆕 Multi-User Dashboard
      dashboard: {
        getMultiUserLogs: 'POST /api/dashboard/logs',
        getAllUsers: 'GET /api/dashboard/logs/all',
        realTimeUpdates: 'POST /api/dashboard/updates',
        crossUserSearch: 'POST /api/dashboard/search',
        userStatistics: 'POST /api/dashboard/statistics'
      },

      // 🆕 Advanced Aggregation
      aggregation: {
        advancedLogs: 'POST /api/aggregator/logs',
        liveStream: 'POST /api/aggregator/stream',
        errorLogs: 'POST /api/aggregator/errors',
        logsByLevel: 'POST /api/aggregator/level/{level}',
        timeGrouped: 'POST /api/aggregator/grouped-by-time',
        aliasSpecific: 'POST /api/aggregator/aliases'
      }
    },
    
    examples: {
      // 🔥 KEY EXAMPLES FOR MULTI-USER DASHBOARD
      multiUserDashboard: {
        method: 'POST',
        url: '/api/dashboard/logs',
        description: 'Get logs from multiple users in one call',
        body: {
          userIds: ['john_doe', 'jane_smith', 'admin_user'],
          date: '2025-09-01',
          includeStats: true
        },
        response: 'Aggregated logs from all specified users with statistics'
      },

      allUsersDashboard: {
        method: 'GET', 
        url: '/api/dashboard/logs/all?date=2025-09-01',
        description: 'Get logs from ALL users in system',
        response: 'Complete dashboard view of all user logs'
      },

      advancedAggregation: {
        method: 'POST',
        url: '/api/aggregator/logs',
        description: 'Advanced filtering, grouping, and sorting',
        body: {
          userIds: ['john_doe', 'jane_smith'],
          logLevels: ['ERROR', 'WARNING'],
          groupBy: 'user',
          sortBy: 'timestamp',
          limit: 500
        }
      },

      realTimeStream: {
        method: 'POST',
        url: '/api/aggregator/stream', 
        description: 'Real-time log monitoring',
        body: {
          userIds: ['john_doe', 'jane_smith'],
          intervalMs: 5000,
          maxLogsPerUser: 50
        }
      },

      crossUserSearch: {
        method: 'POST',
        url: '/api/dashboard/search',
        description: 'Search across multiple users',
        body: {
          userIds: ['john_doe', 'jane_smith'],
          searchQuery: 'database connection failed',
          date: '2025-09-01'
        }
      }
    },

    useCases: {
      developmentTeam: {
        scenario: 'Dev team wants to see all logs across developers',
        endpoint: 'GET /api/dashboard/logs/all',
        description: 'Single API call returns all team member logs'
      },

      productionMonitoring: {
        scenario: 'Monitor production errors across all services',
        endpoint: 'POST /api/aggregator/errors',
        body: { userIds: ['api_service', 'ui_service', 'db_service'] },
        description: 'Get all ERROR level logs from production services'
      },

      realTimeMonitoring: {
        scenario: 'Live monitoring dashboard for operations',
        endpoint: 'POST /api/aggregator/stream',
        body: { userIds: [], intervalMs: 3000 },
        description: 'Real-time log stream from all users every 3 seconds'
      },

      troubleshooting: {
        scenario: 'Search for specific error across all users',
        endpoint: 'POST /api/dashboard/search',
        body: { 
          userIds: [],
          searchQuery: 'connection timeout',
          date: '2025-09-01'
        },
        description: 'Find all instances of connection timeout across system'
      }
    },

    migration: {
      from: 'Single user log viewing',
      to: 'Multi-user dashboard with aggregation',
      benefits: [
        'Single API call for multiple users',
        'Cross-user search and filtering',
        'Real-time monitoring',
        'Advanced aggregation and grouping',
        'Better performance with caching'
      ],
      compatibility: 'All original single-user endpoints still work'
    }
  });
});

// 🎯 Quick endpoints for common use cases
router.get('/quick/all-users-today', async (req, res) => {
  try {
    // Redirect to dashboard all users endpoint
    res.redirect(307, '/api/dashboard/logs/all');
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get all users logs',
      message: error.message
    });
  }
});

router.get('/quick/errors-today', async (req, res) => {
  try {
    // This would need to be implemented as a middleware redirect
    res.json({
      message: 'Use POST /api/aggregator/errors for error logs',
      example: {
        method: 'POST',
        url: '/api/aggregator/errors',
        body: { userIds: [], limit: 100 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get error logs',
      message: error.message
    });
  }
});

export default router;