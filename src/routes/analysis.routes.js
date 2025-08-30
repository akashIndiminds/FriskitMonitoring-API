// src/routes/analysis.routes.js
import express from 'express';
import { 
  analyzeErrors, 
  getErrorTrends, 
  getCriticalErrors, 
  getSystemHealth 
} from '../controllers/analysis.controller.js';

const router = express.Router();

// GET /api/analysis/:service/errors - Analyze errors for service
router.get('/:service/errors', analyzeErrors);

// GET /api/analysis/:service/trends - Get error trends
router.get('/:service/trends', getErrorTrends);

// GET /api/analysis/:service/critical - Get critical errors
router.get('/:service/critical', getCriticalErrors);

// GET /api/analysis/health - Get overall system health
router.get('/health', getSystemHealth);

export default router;

// ===================================
