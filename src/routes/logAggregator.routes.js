// 📁 src/routes/logAggregator.routes.js
// Advanced Log Aggregator Routes
// ==========================================
import express from 'express';
import {
  getAggregatedLogs,
  getLiveLogStream,
  getErrorLogs,
  getLogsByLevel,
  getLogsGroupedByTime,
  getLogsByAliases,
  clearCache,
  getAggregationStats
} from '../controllers/logAggregator.controller.js';

const router = express.Router();

// ==========================================
// ADVANCED AGGREGATION ENDPOINTS
// ==========================================

// 🎯 Main aggregation endpoint with advanced filtering
router.post('/logs', getAggregatedLogs);
/* Body: {
  userIds?: ['user1', 'user2'],           // Optional: specific users (empty = all users)
  aliasNames?: ['MyLogs', 'APILogs'],     // Optional: specific aliases
  date?: '2025-09-01',                    // Optional: specific date (empty = current date)
  logLevels?: ['ERROR', 'WARNING'],       // Optional: filter by levels
  limit?: 1000,                           // Optional: max logs to return
  offset?: 0,                             // Optional: pagination offset
  groupBy?: 'user',                       // Optional: 'timestamp', 'user', 'alias', 'level', 'file', 'hour', 'date'
  sortBy?: 'timestamp',                   // Optional: 'timestamp', 'user', 'alias', 'level', 'file'
  sortOrder?: 'desc',                     // Optional: 'asc' or 'desc'
  includeMetadata?: true,                 // Optional: include grouping and stats
  enableCache?: true                      // Optional: use caching
} */

// 🎯 Real-time log streaming
router.post('/stream', getLiveLogStream);
/* Body: {
  userIds?: ['user1', 'user2'],           // Optional: specific users
  intervalMs?: 5000,                      // Optional: polling interval
  maxLogsPerUser?: 50,                    // Optional: limit per user
  sinceTimestamp?: '2025-09-01T10:00:00Z' // Optional: get logs since timestamp
} */

// ==========================================
// QUICK ACCESS ENDPOINTS
// ==========================================

// 🎯 Get all error logs quickly
router.post('/errors', getErrorLogs);
/* Body: {
  userIds?: ['user1', 'user2'],
  date?: '2025-09-01',
  limit?: 500
} */

// 🎯 Get logs by specific level
router.post('/level/:level', getLogsByLevel);
/* Params: level (ERROR, WARNING, INFO, DEBUG)
   Body: {
     userIds?: ['user1', 'user2'],
     date?: '2025-09-01',
     limit?: 500
   } */

// 🎯 Get logs grouped by time periods
router.post('/grouped-by-time', getLogsGroupedByTime);
/* Body: {
  userIds?: ['user1', 'user2'],
  date?: '2025-09-01',
  groupBy?: 'hour',                      // 'hour' or 'date'
  limit?: 1000
} */

// 🎯 Get logs for specific aliases across all users
router.post('/aliases', getLogsByAliases);
/* Body: {
  aliasNames: ['MyLogs', 'APILogs'],     // Required: alias names
  date?: '2025-09-01',
  limit?: 1000
} */

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

// 🎯 Clear aggregation cache
router.post('/cache/clear', clearCache);

// 🎯 Get aggregation statistics
router.post('/stats', getAggregationStats);
/* Body: {
  userIds?: ['user1', 'user2']           // Optional: get stats for specific users
} */

export default router;