// ==========================================
// src/controllers/dateBasedLogs.controller.js
// ==========================================
import { DateBasedLogService } from '../services/dateBasedLogService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const dateLogService = new DateBasedLogService();

export const getLogsByDate = async (req, res) => {
  try {
    const { directoryPath, date, limit, offset, level, userInfo } = req.body;

    const result = await dateLogService.getLogsByDate(directoryPath, date, {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      level: level?.toUpperCase(),
      userInfo: userInfo || 'developer'
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Logs retrieved by date successfully', result));

  } catch (error) {
    console.error('Error in getLogsByDate:', error);
    res.status(500).json(errorResponse('Failed to retrieve logs by date', { message: error.message }));
  }
};

export const getAvailableDates = async (req, res) => {
  try {
    const { directoryPath } = req.body;

    const result = await dateLogService.getAvailableDates(directoryPath);

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Available dates retrieved successfully', result));

  } catch (error) {
    console.error('Error in getAvailableDates:', error);
    res.status(500).json(errorResponse('Failed to get available dates', { message: error.message }));
  }
};

export const getLogsByDateRange = async (req, res) => {
  try {
    const { directoryPath, startDate, endDate, limit, level } = req.body;

    const result = await dateLogService.getLogsByDateRange(directoryPath, startDate, endDate, {
      limit: parseInt(limit) || 500,
      level: level?.toUpperCase()
    });

    if (!result.success) {
      return res.status(400).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Date range logs retrieved successfully', result));

  } catch (error) {
    console.error('Error in getLogsByDateRange:', error);
    res.status(500).json(errorResponse('Failed to retrieve logs by date range', { message: error.message }));
  }
};