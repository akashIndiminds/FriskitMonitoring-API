// 📁 src/controllers/logAggregator.controller.js
// Advanced Log Aggregator Controller
// ==========================================
import { LogAggregatorService } from '../services/logAggregatorService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const aggregatorService = new LogAggregatorService();

// 🎯 Get aggregated logs with advanced filtering
export const getAggregatedLogs = async (req, res) => {
  try {
    const {
      userIds = [],
      aliasNames = [],
      date,
      logLevels = [],
      limit = 1000,
      offset = 0,
      groupBy = 'timestamp',
      sortBy = 'timestamp',
      sortOrder = 'desc',
      includeMetadata = true,
      enableCache = true
    } = req.body;

    console.log(`🔄 Advanced log aggregation request:`, {
      users: userIds.length || 'ALL',
      aliases: aliasNames.length || 'ALL',
      levels: logLevels.length || 'ALL',
      limit,
      groupBy
    });

    const result = await aggregatorService.getAggregatedLogs({
      userIds,
      aliasNames,
      date,
      logLevels,
      limit,
      offset,
      groupBy,
      sortBy,
      sortOrder,
      includeMetadata,
      enableCache
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Aggregated logs retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getAggregatedLogs:', error);
    res.status(500).json(errorResponse('Failed to retrieve aggregated logs', { 
      message: error.message 
    }));
  }
};

// 🎯 Get live log stream for real-time monitoring
export const getLiveLogStream = async (req, res) => {
  try {
    const {
      userIds = [],
      intervalMs = 5000,
      maxLogsPerUser = 50,
      sinceTimestamp
    } = req.body;

    console.log(`📡 Live log stream request for ${userIds.length || 'ALL'} users`);

    const result = await aggregatorService.getLiveLogStream({
      userIds,
      intervalMs,
      maxLogsPerUser,
      sinceTimestamp
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Live log stream retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getLiveLogStream:', error);
    res.status(500).json(errorResponse('Failed to get live log stream', { 
      message: error.message 
    }));
  }
};

// 🎯 Quick aggregation presets
export const getErrorLogs = async (req, res) => {
  try {
    const { userIds = [], date, limit = 500 } = req.body;

    console.log(`🚨 Error logs request for ${userIds.length || 'ALL'} users`);

    const result = await aggregatorService.getAggregatedLogs({
      userIds,
      date,
      logLevels: ['ERROR'],
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      groupBy: 'user'
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Error logs retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getErrorLogs:', error);
    res.status(500).json(errorResponse('Failed to retrieve error logs', { 
      message: error.message 
    }));
  }
};

// 🎯 Get logs by level (ERROR, WARNING, INFO, DEBUG)
export const getLogsByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    const { userIds = [], date, limit = 500 } = req.body;

    const validLevels = ['ERROR', 'WARNING', 'INFO', 'DEBUG'];
    const targetLevel = level.toUpperCase();

    if (!validLevels.includes(targetLevel)) {
      return res.status(400).json(errorResponse(
        `Invalid log level. Must be one of: ${validLevels.join(', ')}`,
        {
          providedLevel: level,
          validLevels
        }
      ));
    }

    console.log(`📊 ${targetLevel} logs request for ${userIds.length || 'ALL'} users`);

    const result = await aggregatorService.getAggregatedLogs({
      userIds,
      date,
      logLevels: [targetLevel],
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      groupBy: 'user'
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse(`${targetLevel} logs retrieved successfully`, result));

  } catch (error) {
    console.error(`❌ Error in getLogsByLevel (${level}):`, error);
    res.status(500).json(errorResponse(`Failed to retrieve ${level} logs`, { 
      message: error.message 
    }));
  }
};

// 🎯 Get logs grouped by time periods
export const getLogsGroupedByTime = async (req, res) => {
  try {
    const {
      userIds = [],
      date,
      groupBy = 'hour', // 'hour', 'date'
      limit = 1000
    } = req.body;

    if (!['hour', 'date'].includes(groupBy)) {
      return res.status(400).json(errorResponse(
        'Invalid groupBy parameter. Must be "hour" or "date"'
      ));
    }

    console.log(`⏰ Time-grouped logs request (${groupBy}) for ${userIds.length || 'ALL'} users`);

    const result = await aggregatorService.getAggregatedLogs({
      userIds,
      date,
      limit,
      groupBy,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      includeMetadata: true
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Time-grouped logs retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getLogsGroupedByTime:', error);
    res.status(500).json(errorResponse('Failed to retrieve time-grouped logs', { 
      message: error.message 
    }));
  }
};

// 🎯 Get logs for specific aliases across all users
export const getLogsByAliases = async (req, res) => {
  try {
    const { aliasNames, date, limit = 1000 } = req.body;

    if (!aliasNames || !Array.isArray(aliasNames) || aliasNames.length === 0) {
      return res.status(400).json(errorResponse(
        'aliasNames array is required and cannot be empty',
        {
          example: {
            aliasNames: ['MyLogs', 'APILogs', 'ErrorLogs'],
            date: '2025-09-01'
          }
        }
      ));
    }

    console.log(`📂 Alias-specific logs request for: [${aliasNames.join(', ')}]`);

    const result = await aggregatorService.getAggregatedLogs({
      userIds: [], // All users
      aliasNames,
      date,
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      groupBy: 'alias'
    });

    if (!result.success) {
      return res.status(404).json(errorResponse(result.error, result));
    }

    res.json(successResponse('Alias-specific logs retrieved successfully', result));

  } catch (error) {
    console.error('❌ Error in getLogsByAliases:', error);
    res.status(500).json(errorResponse('Failed to retrieve alias-specific logs', { 
      message: error.message 
    }));
  }
};

// 🎯 Clear aggregation cache
export const clearCache = async (req, res) => {
  try {
    aggregatorService.clearCache();
    
    res.json(successResponse('Aggregation cache cleared successfully', {
      clearedAt: new Date().toISOString()
    }));

  } catch (error) {
    console.error('❌ Error in clearCache:', error);
    res.status(500).json(errorResponse('Failed to clear cache', { 
      message: error.message 
    }));
  }
};

// 🎯 Get aggregation statistics
export const getAggregationStats = async (req, res) => {
  try {
    const { userIds = [] } = req.body;

    // Get a quick sample to calculate stats
    const sampleResult = await aggregatorService.getAggregatedLogs({
      userIds,
      limit: 0, // Just metadata
      includeMetadata: true,
      enableCache: false
    });

    if (!sampleResult.success) {
      return res.status(404).json(errorResponse(sampleResult.error, sampleResult));
    }

    const stats = {
      totalUsers: sampleResult.metadata.totalUsers,
      processedUsers: sampleResult.metadata.processedUsers,
      totalFiles: sampleResult.metadata.totalFiles,
      totalLogs: sampleResult.metadata.totalLogs,
      cacheSize: aggregatorService.cache.size,
      lastUpdated: new Date().toISOString(),
      availableFeatures: {
        filtering: ['userIds', 'aliasNames', 'logLevels', 'date'],
        grouping: ['timestamp', 'user', 'alias', 'level', 'file', 'hour', 'date'],
        sorting: ['timestamp', 'user', 'alias', 'level', 'file'],
        realtime: true,
        caching: true
      }
    };

    res.json(successResponse('Aggregation statistics retrieved successfully', { stats }));

  } catch (error) {
    console.error('❌ Error in getAggregationStats:', error);
    res.status(500).json(errorResponse('Failed to get aggregation statistics', { 
      message: error.message 
    }));
  }
};