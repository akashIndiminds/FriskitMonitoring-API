import express from 'express';
import { 
  getLogsByDate, 
  getLatestLogs, 
  getAvailableDates, 
  searchLogs 
} from '../controllers/logs.controller.js';

const router = express.Router();

// GET /api/logs/:service/dates - Get available log dates for service
router.get('/:service/dates', getAvailableDates);

// GET /api/logs/:service/latest - Get latest logs
router.get('/:service/latest', getLatestLogs);

// GET /api/logs/:service/date/:date - Get logs by specific date
router.get('/:service/date/:date', getLogsByDate);

// GET /api/logs/:service/search - Search logs
router.get('/:service/search', searchLogs);

export default router;