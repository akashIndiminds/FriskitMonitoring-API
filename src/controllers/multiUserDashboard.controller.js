// 📁 src/controllers/multiUserDashboard.controller.js
// FIXED - Simple & Clean Dashboard Controller
// ==========================================
import { MultiUserDashboardService } from '../services/multiUserDashboardService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const dashboardService = new MultiUserDashboardService();

// 🎯 Get ALL users logs - SIMPLE & CLEAN
export const getAllUsersLogs = async (req, res) => {
  try {
    const { date } = req.query;

    console.log(`🌐 All users dashboard request - Date: ${date || 'current date'}`);

    const result = await dashboardService.getAllUsersLogsSimple({ date });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('All users logs retrieved successfully', result.data));

  } catch (error) {
    console.error('❌ Error in getAllUsersLogs:', error);
    res.status(500).json(errorResponse('Failed to retrieve all users logs', { 
      message: error.message 
    }));
  }
};

// 🎯 Get specific users logs - SIMPLE & CLEAN
export const getDashboardLogs = async (req, res) => {
  try {
    const { userIds = [] } = req.body;
    const { date } = req.query;

    console.log(`📊 Dashboard request: ${userIds.length} users specified`);

    const result = await dashboardService.getSpecificUsersLogsSimple(userIds, { date });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Dashboard logs retrieved successfully', result.data));

  } catch (error) {
    console.error('❌ Error in getDashboardLogs:', error);
    res.status(500).json(errorResponse('Failed to retrieve dashboard logs', { 
      message: error.message 
    }));
  }
};