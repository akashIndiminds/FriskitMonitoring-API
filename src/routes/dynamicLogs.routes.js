// Enhanced src/routes/dynamicLogs.routes.js (Simplified)
// ==========================================
import express from 'express';
import {
  getLogsByPath,
  getFilesInDirectory,
  searchLogs,
  getFileStats,
  getLatestLogs
} from '../controllers/dynamicLogs.controller.js';
import {
  getLogsByDate,
  getAvailableDates,
  getLogsByDateRange
} from '../controllers/dateBasedLogs.controller.js';
import {
  getRecentPaths,
  getPopularPaths,
  searchRecentPaths,
  clearRecentPaths
} from '../controllers/recentPaths.controller.js';
import { 
  validatePathRequest, 
  validateSearchRequest 
} from '../middleware/validation.js';

const router = express.Router();

// All log operations - ONE validation for all
router.post('/files', validatePathRequest, getLogsByPath);
router.post('/directory', validatePathRequest, getFilesInDirectory);
router.post('/search', validateSearchRequest, searchLogs);
router.post('/stats', validatePathRequest, getFileStats);
router.post('/latest', validatePathRequest, getLatestLogs);

// Date-based log operations - SAME validation
router.post('/by-date', validatePathRequest, getLogsByDate);
router.post('/available-dates', validatePathRequest, getAvailableDates);
router.post('/date-range', validatePathRequest, getLogsByDateRange);

// Recent paths management
router.get('/recent', getRecentPaths);
router.get('/popular', getPopularPaths);
router.get('/search-recent', searchRecentPaths);
router.delete('/recent', clearRecentPaths);

export default router;