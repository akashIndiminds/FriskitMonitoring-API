// src/controllers/recentPaths.controller.js - Updated with Persistent Storage
// ==========================================
import { persistentRecentPathsService } from '../services/persistentRecentPaths.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export const getRecentPaths = async (req, res) => {
  try {
    const recentPaths = persistentRecentPathsService.getRecentPaths();
    const stats = persistentRecentPathsService.getStorageStats();
    
    res.json(successResponse('Recent paths retrieved successfully', { 
      recentPaths,
      stats: {
        total: stats.totalRecentPaths,
        pathTypes: stats.pathTypes,
        userDistribution: stats.userDistribution
      }
    }));
  } catch (error) {
    console.error('Error getting recent paths:', error);
    res.status(500).json(errorResponse('Failed to get recent paths', { 
      message: error.message 
    }));
  }
};

export const getPopularPaths = async (req, res) => {
  try {
    const popularPaths = persistentRecentPathsService.getPopularPaths();
    res.json(successResponse('Popular paths retrieved successfully', { popularPaths }));
  } catch (error) {
    console.error('Error getting popular paths:', error);
    res.status(500).json(errorResponse('Failed to get popular paths', { 
      message: error.message 
    }));
  }
};

export const getPathHistory = async (req, res) => {
  try {
    const pathHistory = persistentRecentPathsService.getPathHistory();
    res.json(successResponse('Path history retrieved successfully', { pathHistory }));
  } catch (error) {
    console.error('Error getting path history:', error);
    res.status(500).json(errorResponse('Failed to get path history', { 
      message: error.message 
    }));
  }
};

export const searchRecentPaths = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.status(400).json(errorResponse('Query must be at least 2 characters'));
    }

    const results = persistentRecentPathsService.searchRecentPaths(query);
    res.json(successResponse('Search completed successfully', { results, query }));
  } catch (error) {
    console.error('Error searching recent paths:', error);
    res.status(500).json(errorResponse('Search failed', { 
      message: error.message 
    }));
  }
};

export const clearRecentPaths = async (req, res) => {
  try {
    const success = await persistentRecentPathsService.clearAllPaths();
    if (success) {
      res.json(successResponse('Recent paths cleared successfully'));
    } else {
      res.status(500).json(errorResponse('Failed to clear recent paths'));
    }
  } catch (error) {
    console.error('Error clearing recent paths:', error);
    res.status(500).json(errorResponse('Failed to clear paths', { 
      message: error.message 
    }));
  }
};

export const removeRecentPath = async (req, res) => {
  try {
    const { pathKey } = req.params;
    if (!pathKey) {
      return res.status(400).json(errorResponse('pathKey parameter is required'));
    }

    const success = await persistentRecentPathsService.removeRecentPath(decodeURIComponent(pathKey));
    if (success) {
      res.json(successResponse('Path removed successfully'));
    } else {
      res.status(404).json(errorResponse('Path not found'));
    }
  } catch (error) {
    console.error('Error removing recent path:', error);
    res.status(500).json(errorResponse('Failed to remove path', { 
      message: error.message 
    }));
  }
};

export const getStorageStats = async (req, res) => {
  try {
    const stats = persistentRecentPathsService.getStorageStats();
    res.json(successResponse('Storage statistics retrieved successfully', { stats }));
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json(errorResponse('Failed to get storage statistics', { 
      message: error.message 
    }));
  }
};

export const getStorageFileContents = async (req, res) => {
  try {
    const contents = await persistentRecentPathsService.getStorageFileContents();
    if (contents) {
      res.json(successResponse('Storage file contents retrieved successfully', { contents }));
    } else {
      res.status(404).json(errorResponse('Storage file not found or empty'));
    }
  } catch (error) {
    console.error('Error getting storage file contents:', error);
    res.status(500).json(errorResponse('Failed to get storage file contents', { 
      message: error.message 
    }));
  }
};

export const createBackup = async (req, res) => {
  try {
    const backupFile = await persistentRecentPathsService.createBackup();
    if (backupFile) {
      res.json(successResponse('Backup created successfully', { backupFile }));
    } else {
      res.status(500).json(errorResponse('Failed to create backup'));
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json(errorResponse('Failed to create backup', { 
      message: error.message 
    }));
  }
};

export const cleanupOldEntries = async (req, res) => {
  try {
    const { days } = req.query;
    const daysOld = parseInt(days) || 30;
    
    const removedCount = await persistentRecentPathsService.cleanupOldEntries(daysOld);
    res.json(successResponse(`Cleanup completed successfully`, { 
      removedCount,
      daysOld,
      message: `Removed ${removedCount} entries older than ${daysOld} days`
    }));
  } catch (error) {
    console.error('Error cleaning up old entries:', error);
    res.status(500).json(errorResponse('Failed to cleanup old entries', { 
      message: error.message 
    }));
  }
};

export const getRecentPathsServiceHealth = async (req, res) => {
  try {
    const stats = persistentRecentPathsService.getStorageStats();
    res.json({
      status: 'OK',
      service: 'Recent Paths Service',
      storage: {
        totalPaths: stats.totalRecentPaths,
        storageFile: stats.storageFile,
        lastAccess: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting recent paths service health:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};