// src/routes/index.routes.js - UPDATED VERSION
// ==========================================
import express from 'express';
import aliasLogsRoutes from './aliasLogs.routes.js';  // 🆕 NEW

const router = express.Router();

// 🆕 NEW: Alias-based logs routes
router.use('/alias-logs', aliasLogsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Simple Log Analyzer',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime()
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'Simple Alias-Based Log Analyzer',
    version: '2.0.0',
    description: 'Simple log analysis system with user aliases',
    features: [
      'User-based aliases',
      'Date-based file finding',
      'Raw log content display',
      'File-separated responses',
      'JSON storage (no database)'
    ],
    endpoints: {
      createAlias: 'POST /api/alias-logs/alias',
      getLogs: 'GET /api/alias-logs/user/{userId}/alias/{aliasName}',
      getAllUserLogs: 'GET /api/alias-logs/user/{userId}/all',
      getUserAliases: 'GET /api/alias-logs/user/{userId}/aliases'
    },
    examples: {
      createAlias: {
        method: 'POST',
        url: '/api/alias-logs/alias',
        body: {
          userId: 'john_doe',
          aliasName: 'MyLogs',
          basePath: '\\\\\\\\server\\\\logs\\\\folder'
        }
      },
      getLogs: {
        method: 'GET',
        url: '/api/alias-logs/user/john_doe/alias/MyLogs',
        queryParams: {
          date: '2025-09-01 (optional, defaults to today)'
        }
      }
    }
  });
});

export default router;