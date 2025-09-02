// 📁 src/middleware/dashboardMiddleware.js
// Multi-User Dashboard Middleware
// ==========================================
import { UserAliasService } from '../services/userAliasService.js';

const userAliasService = new UserAliasService();

// 🎯 Validate multi-user request
export const validateMultiUserRequest = (req, res, next) => {
  try {
    const { userIds } = req.body;

    // If userIds provided, validate they exist
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const allUsers = userAliasService.getAllUsers();
      const invalidUsers = userIds.filter(userId => !allUsers.includes(userId));
      
      if (invalidUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Some users not found in system',
          invalidUsers,
          availableUsers: allUsers,
          suggestion: 'Create aliases for these users first or remove them from request'
        });
      }

      console.log(`✅ Multi-user request validated: ${userIds.length} users`);
    } else {
      console.log(`📋 Multi-user request: ALL users will be processed`);
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate multi-user request',
      message: error.message
    });
  }
};

// 🎯 Add request metadata
export const addRequestMetadata = (req, res, next) => {
  req.requestMetadata = {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    isMultiUser: Array.isArray(req.body?.userIds) && req.body.userIds.length > 0,
    requestType: req.body?.userIds?.length > 0 ? 'multi-user' : 'all-users'
  };

  console.log(`📝 Request metadata:`, {
    id: req.requestMetadata.requestId,
    type: req.requestMetadata.requestType,
    users: req.body?.userIds?.length || 'ALL'
  });

  next();
};

// 🎯 Rate limiting for dashboard requests
export const dashboardRateLimit = () => {
  const requests = new Map();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // 30 requests per minute per IP

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }

    const clientRequests = requests.get(clientId);
    const recentRequests = clientRequests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many dashboard requests',
        retryAfter: '1 minute',
        limit: maxRequests,
        windowMs: windowMs,
        suggestion: 'Use caching or reduce request frequency'
      });
    }

    recentRequests.push(now);
    requests.set(clientId, recentRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.1) { // 10% chance
      for (const [key, times] of requests.entries()) {
        const validTimes = times.filter(time => time > windowStart);
        if (validTimes.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, validTimes);
        }
      }
    }

    next();
  };
};

// 🎯 Log request/response for debugging
export const logDashboardActivity = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`📊 Dashboard Request:`, {
    method: req.method,
    url: req.originalUrl,
    userIds: req.body?.userIds?.length || 'ALL',
    date: req.body?.date || req.query?.date || 'current',
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Capture original send function
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // Log response
    console.log(`📊 Dashboard Response:`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: res.statusCode < 400,
      timestamp: new Date().toISOString()
    });

    // Call original send
    originalSend.call(this, body);
  };

  next();
};

// 🎯 Validate aggregation parameters
export const validateAggregationParams = (req, res, next) => {
  try {
    const {
      logLevels,
      groupBy,
      sortBy,
      sortOrder,
      limit,
      offset
    } = req.body;

    const errors = [];

    // Validate log levels
    if (logLevels && Array.isArray(logLevels)) {
      const validLevels = ['ERROR', 'WARNING', 'INFO', 'DEBUG'];
      const invalidLevels = logLevels.filter(level => !validLevels.includes(level.toUpperCase()));
      if (invalidLevels.length > 0) {
        errors.push({
          field: 'logLevels',
          message: `Invalid log levels: ${invalidLevels.join(', ')}`,
          validValues: validLevels
        });
      }
    }

    // Validate groupBy
    if (groupBy) {
      const validGroupBy = ['timestamp', 'user', 'alias', 'level', 'file', 'hour', 'date'];
      if (!validGroupBy.includes(groupBy)) {
        errors.push({
          field: 'groupBy',
          message: `Invalid groupBy value: ${groupBy}`,
          validValues: validGroupBy
        });
      }
    }

    // Validate sortBy
    if (sortBy) {
      const validSortBy = ['timestamp', 'user', 'alias', 'level', 'file'];
      if (!validSortBy.includes(sortBy)) {
        errors.push({
          field: 'sortBy',
          message: `Invalid sortBy value: ${sortBy}`,
          validValues: validSortBy
        });
      }
    }

    // Validate sortOrder
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      errors.push({
        field: 'sortOrder',
        message: `Invalid sortOrder value: ${sortOrder}`,
        validValues: ['asc', 'desc']
      });
    }

    // Validate limit and offset
    if (limit && (typeof limit !== 'number' || limit < 0 || limit > 10000)) {
      errors.push({
        field: 'limit',
        message: 'Limit must be a number between 0 and 10000'
      });
    }

    if (offset && (typeof offset !== 'number' || offset < 0)) {
      errors.push({
        field: 'offset',
        message: 'Offset must be a non-negative number'
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid aggregation parameters',
        validationErrors: errors
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate aggregation parameters',
      message: error.message
    });
  }
};

// 🎯 Check system resources before processing
export const checkSystemResources = (req, res, next) => {
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const maxMemoryMB = 512; // Set your limit

    if (memUsageMB > maxMemoryMB) {
      console.warn(`⚠️ High memory usage: ${memUsageMB}MB`);
      
      // For large requests, suggest smaller limits
      if (req.body?.limit > 1000) {
        return res.status(503).json({
          success: false,
          error: 'System under high load',
          currentMemoryUsage: `${memUsageMB}MB`,
          suggestion: 'Reduce limit or try again later',
          recommendedLimit: 500
        });
      }
    }

    // Add system info to request
    req.systemInfo = {
      memoryUsageMB,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    next();
  } catch (error) {
    console.error('❌ Error checking system resources:', error);
    next(); // Continue even if resource check fails
  }
};