// 📁 NEW FILE 5: src/routes/aliasLogs.routes.js
// ==========================================
import express from 'express';
import {
  createAlias,
  getLogsByAlias,
  getAllUserLogs,
  getUserAliases,
  deleteAlias,
  getAllUsers
} from '../controllers/aliasLogs.controller.js';

const router = express.Router();

// ==========================================
// ALIAS MANAGEMENT
// ==========================================
router.post('/alias', createAlias);                              // Create alias
router.get('/user/:userId/aliases', getUserAliases);             // Get user aliases  
router.delete('/user/:userId/alias/:aliasName', deleteAlias);    // Delete alias

// ==========================================
// LOG RETRIEVAL
// ==========================================
router.get('/user/:userId/alias/:aliasName', getLogsByAlias);    // Get logs by alias
router.get('/user/:userId/all', getAllUserLogs);                 // Get all user logs

// ==========================================
// ADMIN
// ==========================================
router.get('/admin/users', getAllUsers);                         // Get all users

export default router;