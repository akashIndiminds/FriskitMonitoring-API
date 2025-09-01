// src/routes/index.routes.js
// ==========================================
import express from 'express';
import dynamicLogsRoutes from './dynamicLogs.routes.js';

const router = express.Router();

router.use('/logs', dynamicLogsRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Dynamic Log Analyzer',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime()
  });
});

router.get('/info', (req, res) => {
  res.json({
    name: 'Dynamic Log Analyzer API',
    version: '2.0.0',
    description: 'Universal log analysis system for any file path',
    features: [
      'Dynamic file path support',
      'Multi-format log parsing (.log, .txt, .out, .err)',
      'Advanced log searching and filtering',
      'Statistical analysis and insights',
      'File directory browsing'
    ],
    endpoints: {
      files: 'POST /api/logs/files',
      directory: 'POST /api/logs/directory',
      search: 'POST /api/logs/search',
      stats: 'POST /api/logs/stats'
    },
    limits: {
      maxFileSize: '100MB',
      maxRequestRate: '200 per 15 minutes',
      maxResultLimit: '10,000 lines'
    }
  });
});

export default router;
