// ========================================
// src/routes/serviceManagement.routes.js
import express from 'express';
import {
  addService,
  removeService,
  updateService,
  getAllServices,
  validatePath,
  discoverServices
} from '../controllers/serviceManagement.controller.js';

const router = express.Router();

// ✅ RUNTIME SERVICE MANAGEMENT ROUTES
router.get('/all', getAllServices);
router.post('/add', addService);
router.delete('/:serviceName', removeService);
router.put('/:serviceName', updateService);
router.post('/validate-path', validatePath);
router.post('/discover', discoverServices);

export default router;



// Add this line with other routes
app.use('/api/service-management', serviceManagementRoutes);