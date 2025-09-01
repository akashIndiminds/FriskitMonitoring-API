
// ==========================================
// src/controllers/dynamicLogs.controller.js
// ==========================================
import { DynamicLogService } from '../services/dynamicLog.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const dynamicLogService = new DynamicLogService();

export const getLogsByPath = async (req, res) => {
  try {
    const { filePath, fileName, limit, offset, level, userInfo } = req.body;

    const result = await dynamicLogService.getLogsByPath(filePath, fileName, {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      level: level?.toUpperCase(),
      userInfo: userInfo || 'developer'
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Logs retrieved successfully', result));

  } catch (error) {
    console.error('Error in getLogsByPath:', error);
    res.status(500).json(errorResponse('Failed to retrieve logs', { message: error.message }));
  }
};

export const getLatestLogs = async (req, res) => {
  try {
    const { filePath, fileName, lastTimestamp, limit } = req.body;

    const result = await dynamicLogService.getLatestLogs(
      filePath, 
      fileName, 
      lastTimestamp, 
      parseInt(limit) || 50
    );

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Latest logs retrieved', result));

  } catch (error) {
    console.error('Error in getLatestLogs:', error);
    res.status(500).json(errorResponse('Failed to get latest logs', { message: error.message }));
  }
};

export const getFilesInDirectory = async (req, res) => {
  try {
    const { directoryPath } = req.body;

    const result = await dynamicLogService.getFilesInDirectory(directoryPath);

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Directory contents retrieved successfully', result));

  } catch (error) {
    console.error('Error in getFilesInDirectory:', error);
    res.status(500).json(errorResponse('Failed to get directory files', { message: error.message }));
  }
};

export const searchLogs = async (req, res) => {
  try {
    const { filePath, fileName, searchQuery, level, limit, caseSensitive } = req.body;

    const result = await dynamicLogService.searchLogs(filePath, fileName, searchQuery, {
      level: level?.toUpperCase(),
      limit: parseInt(limit) || 100,
      caseSensitive: caseSensitive === true
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Search completed successfully', result));

  } catch (error) {
    console.error('Error in searchLogs:', error);
    res.status(500).json(errorResponse('Failed to search logs', { message: error.message }));
  }
};

export const getFileStats = async (req, res) => {
  try {
    const { filePath, fileName } = req.body;

    const result = await dynamicLogService.getFileStatistics(filePath, fileName);

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('File statistics retrieved successfully', result));

  } catch (error) {
    console.error('Error in getFileStats:', error);
    res.status(500).json(errorResponse('Failed to get file statistics', { message: error.message }));
  }
};