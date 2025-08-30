import express from 'express';
import { 
  analyzeWithAI, 
  getLogSummary, 
  predictIssues, 
  getSystemHealth 
} from '../controllers/analysis.controller.js';

const router = express.Router();

// POST /api/analysis/:service/ai - Analyze errors with AI
router.get('/:service/ai', analyzeWithAI);

// GET /api/analysis/:service/summary - Get AI-powered log summary
router.get('/:service/summary', getLogSummary);

// GET /api/analysis/:service/predictions - Get issue predictions
router.get('/:service/predictions', predictIssues);

// GET /api/analysis/health - Get overall system health
router.get('/health', getSystemHealth);

export default router;