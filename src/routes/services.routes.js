import express from 'express';
import { getServicesStatus, getServiceDetails } from '../controllers/services.controller.js';

const router = express.Router();

// GET /api/services/status - Get all services status
router.get('/status', getServicesStatus);

// GET /api/services/:service/details - Get detailed service info
router.get('/:service/details', getServiceDetails);

export default router;