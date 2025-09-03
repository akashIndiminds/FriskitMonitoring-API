// 📁 src/routes/multiUserDashboard.routes.js
// FIXED - Only 2 Simple Endpoints
// ==========================================
import express from 'express';
import {
  getDashboardLogs,
  getAllUsersLogs
} from '../controllers/multiUserDashboard.controller.js';

const router = express.Router();

// ==========================================
// ONLY 2 ENDPOINTS - KEEP IT SIMPLE
// ==========================================

// 🎯 Get ALL users logs (for polling)
router.get('/logs/all', getAllUsersLogs);
// Usage: GET /api/dashboard/logs/all?date=2025-09-01

// 🎯 Get SPECIFIC users logs  
router.post('/logs', getDashboardLogs);
// Usage: POST /api/dashboard/logs
// Body: { "userIds": ["john_doe", "jane_smith"], "date": "2025-09-01" }

export default router;