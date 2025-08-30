// ========================================
// src/routes/services.routes.js - Enhanced  
import express from 'express';
import { getServicesStatus, getServiceDetails } from '../controllers/services.controller.js';

const servicesRouter = express.Router();

// GET /api/services/status - Get all services status (dynamic)
servicesRouter.get('/status', getServicesStatus);

// GET /api/services/:service/details - Get detailed service info (any service)
servicesRouter.get('/:service/details', getServiceDetails);

export { servicesRouter };