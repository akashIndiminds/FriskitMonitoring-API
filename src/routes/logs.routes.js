// src/routes/logs.routes.js - Enhanced with dynamic service support
import express from 'express';
import { 
  getLogsByDate, 
  getLatestLogs, 
  getAvailableDates, 
  searchLogs,
  getAvailableServices  // ✅ New endpoint
} from '../controllers/logs.controller.js';

const router = express.Router();

// ✅ NEW - Get all available/configured services
router.get('/services', getAvailableServices);

// GET /api/logs/:service/dates - Get available log dates for service
router.get('/:service/dates', getAvailableDates);

// GET /api/logs/:service/latest - Get latest logs (today's logs)
router.get('/:service/latest', getLatestLogs);

// GET /api/logs/:service/date/:date - Get logs by specific date
router.get('/:service/date/:date', getLogsByDate);

// GET /api/logs/:service/search - Search logs
router.get('/:service/search', searchLogs);


export default router;