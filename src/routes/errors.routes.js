import express from 'express';
import { 
  getErrorAnalysis, 
  getErrorTrends, 
  getCriticalErrors, 
  getErrorsByCategory 
} from '../controllers/errors.controller.js';

const router = express.Router();

// GET /api/errors/:service/analysis - Get error analysis for service
router.get('/:service/analysis', getErrorAnalysis);

// GET /api/errors/:service/trends - Get error trends
router.get('/:service/trends', getErrorTrends);

// GET /api/errors/:service/critical - Get critical errors
router.get('/:service/critical', getCriticalErrors);

// GET /api/errors/:service/categories - Get errors by category
router.get('/:service/categories', getErrorsByCategory);

export default router;