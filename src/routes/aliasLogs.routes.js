// 📁 src/routes/aliasLogs.routes.js
// UPDATED - With Optional Edit Endpoint
// ==========================================
import express from "express";
import {
  createAlias,
  getLogsByAlias,
  getAllUserLogs,
  getUserAliases,
  deleteAlias,
  getAllUsers,
  updateAlias, // ✅ NEW: Edit functionality
} from "../controllers/users.controller.js";

const router = express.Router();

// ==========================================
// ALIAS MANAGEMENT (COMPLETE CRUD)
// ==========================================
router.post("/alias", createAlias); // ✅ Create alias
router.get("/user/:userId/aliases", getUserAliases); // ✅ Read user aliases
router.put("/user/:userId/alias/:aliasName", updateAlias); // ✅ UPDATE/Edit alias
router.delete("/user/:userId/alias/:aliasName", deleteAlias); // ✅ Delete alias

// ==========================================
// LOG RETRIEVAL
// ==========================================
router.get("/user/:userId/alias/:aliasName", getLogsByAlias); // Get logs by alias
router.get("/user/:userId/all", getAllUserLogs); // Get all user logs

// ==========================================
// ADMIN
// ==========================================
router.get("/admin/users", getAllUsers); // Get all users

export default router;
