// ========================================
// src/routes/analysis.routes.js - Enhanced
import express from 'express';
import { 
  analyzeErrors, 
  getErrorTrends, 
  getCriticalErrors, 
  getSystemHealth 
} from '../controllers/analysis.controller.js';

const analysisRouter = express.Router();

// Works with ANY configured service dynamically
analysisRouter.get('/:service/errors', analyzeErrors);
analysisRouter.get('/:service/trends', getErrorTrends);
analysisRouter.get('/:service/critical', getCriticalErrors);
analysisRouter.get('/health', getSystemHealth);

export { analysisRouter };
