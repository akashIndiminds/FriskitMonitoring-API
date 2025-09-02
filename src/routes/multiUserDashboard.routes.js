// 📁 src/routes/multiUserDashboard.routes.js
// Multi-User Dashboard Routes
// ==========================================
import express from 'express';
import {
  getDashboardLogs,
  getAllUsersLogs,
  getDashboardUpdates,
  searchAcrossUsers,
  getUserStatistics,
  getUserDashboardLogs,
  getDashboardOverview
} from '../controllers/multiUserDashboard.controller.js';

const router = express.Router();

// ==========================================
// MULTI-USER DASHBOARD ENDPOINTS
// ==========================================

// 🎯 Get aggregated logs from specific users
router.post('/logs', getDashboardLogs);
// Body: { userIds: ['user1', 'user2'], date?: '2025-09-01', includeStats?: true }

// 🎯 Get all users logs (no specific users)
router.get('/logs/all', getAllUsersLogs);
// Query: ?date=2025-09-01&includeStats=true

// 🎯 Get dashboard overview/summary
router.post('/overview', getDashboardOverview);
// Body: { userIds?: ['user1', 'user2'] }

// 🎯 Real-time updates for dashboard (polling)
router.post('/updates', getDashboardUpdates);
// Body: { userIds: ['user1', 'user2'], lastUpdateTime?: '2025-09-01T10:00:00Z', maxLogs?: 100 }

// ==========================================
// SEARCH & ANALYTICS
// ==========================================

// 🎯 Search across multiple users
router.post('/search', searchAcrossUsers);
// Body: { userIds: ['user1', 'user2'], searchQuery: 'error', date?: '2025-09-01', caseSensitive?: false }

// 🎯 Get user statistics
router.post('/statistics', getUserStatistics);
// Body: { userIds: ['user1', 'user2'] }

// ==========================================
// SINGLE USER ENDPOINTS (for dashboard)
// ==========================================

// 🎯 Get specific user's logs for dashboard
router.get('/user/:userId/logs', getUserDashboardLogs);
// Params: userId, Query: ?date=2025-09-01

export default router;