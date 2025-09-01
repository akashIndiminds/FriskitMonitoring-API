// Enhanced src/routes/dynamicLogs.routes.js - With Updated Storage Endpoints
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
  getPathHistory,
  searchRecentPaths,
  clearRecentPaths,
  removeRecentPath,
  getStorageStats,
  getStorageFileContents,
  createBackup,
  cleanupOldEntries,
  getRecentPathsServiceHealth
} from '../controllers/recentPaths.controller.js';
import { 
  validatePathRequest, 
  validateSearchRequest 
} from '../middleware/validation.js';

const router = express.Router();

// ==========================================
// CORE LOG OPERATIONS
// ==========================================

// All log operations - ONE validation for all
router.post('/files', validatePathRequest, getLogsByPath);
router.post('/directory', validatePathRequest, getFilesInDirectory);
router.post('/search', validateSearchRequest, searchLogs);
router.post('/stats', validatePathRequest, getFileStats);
router.post('/latest', validatePathRequest, getLatestLogs);

// ==========================================
// DATE-BASED LOG OPERATIONS
// ==========================================

// Date-based log operations - SAME validation
router.post('/by-date', validatePathRequest, getLogsByDate);
router.post('/available-dates', validatePathRequest, getAvailableDates);
router.post('/date-range', validatePathRequest, getLogsByDateRange);

// ==========================================
// RECENT PATHS MANAGEMENT (PERSISTENT)
// ==========================================

// Basic recent paths operations
router.get('/recent', getRecentPaths);
router.get('/popular', getPopularPaths);
router.get('/history', getPathHistory);
router.get('/search-recent', searchRecentPaths);
router.delete('/recent', clearRecentPaths);

// Advanced path management
router.delete('/recent/:pathKey', removeRecentPath);

// ==========================================
// STORAGE MANAGEMENT & DEBUGGING
// ==========================================

// Storage statistics and health
router.get('/storage/stats', getStorageStats);
router.get('/storage/contents', getStorageFileContents); // 📁 JSON file contents for debugging
router.post('/storage/backup', createBackup);
router.post('/storage/cleanup', cleanupOldEntries);

// ==========================================
// HEALTH CHECK ENDPOINTS
// ==========================================

// Quick health check for recent paths service
router.get('/recent/health', getRecentPathsServiceHealth);

export default router;