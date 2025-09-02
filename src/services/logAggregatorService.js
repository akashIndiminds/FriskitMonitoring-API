// 📁 src/services/logAggregatorService.js
// Advanced Log Aggregation Service
// ==========================================
import { UserAliasService } from './userAliasService.js';
import { SimpleLogService } from './simpleLogService.js';

export class LogAggregatorService {
  constructor() {
    this.userAliasService = new UserAliasService();
    this.logService = new SimpleLogService();
    this.cache = new Map(); // Cache for better performance
    this.cacheTimeout = 60000; // 1 minute cache
  }

  // 🎯 Smart log aggregation with filtering and grouping
  async getAggregatedLogs(config = {}) {
    try {
      const {
        userIds = [],
        aliasNames = [],
        date = null,
        logLevels = [],
        limit = 1000,
        offset = 0,
        groupBy = 'timestamp', // 'timestamp', 'user', 'alias', 'level'
        sortBy = 'timestamp',
        sortOrder = 'desc',
        includeMetadata = true,
        enableCache = true
      } = config;

      console.log(`🔄 Aggregating logs with config:`, {
        users: userIds.length || 'ALL',
        aliases: aliasNames.length || 'ALL',
        date: date || 'current',
        levels: logLevels.length || 'ALL'
      });

      const cacheKey = this.generateCacheKey(config);
      
      // Check cache first
      if (enableCache && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('📋 Returning cached result');
          return { ...cached.data, fromCache: true };
        }
      }

      // Determine users to process
      const targetUsers = userIds.length > 0 ? userIds : this.userAliasService.getAllUsers();
      
      if (targetUsers.length === 0) {
        return {
          success: false,
          error: 'No users found in system',
          suggestion: 'Create user aliases first'
        };
      }

      const aggregationResult = {
        logs: [],
        metadata: {
          totalUsers: targetUsers.length,
          processedUsers: 0,
          totalFiles: 0,
          totalLogs: 0,
          groupedData: {},
          filterCounts: {
            beforeFiltering: 0,
            afterFiltering: 0,
            levelFiltering: 0,
            aliasFiltering: 0
          }
        },
        config: {
          ...config,
          executedAt: new Date().toISOString()
        }
      };

      // Process each user
      for (const userId of targetUsers) {
        const userResult = await this.processUserLogs(userId, {
          date,
          aliasNames,
          logLevels
        });

        if (userResult.success) {
          aggregationResult.logs.push(...userResult.logs);
          aggregationResult.metadata.totalFiles += userResult.filesCount;
          aggregationResult.metadata.processedUsers++;
        } else {
          console.warn(`⚠️ Failed to process user ${userId}: ${userResult.error}`);
        }
      }

      // Apply filtering
      let filteredLogs = aggregationResult.logs;
      aggregationResult.metadata.filterCounts.beforeFiltering = filteredLogs.length;

      // Level filtering
      if (logLevels.length > 0) {
        filteredLogs = filteredLogs.filter(log => logLevels.includes(log.logLevel));
        aggregationResult.metadata.filterCounts.levelFiltering = filteredLogs.length;
      }

      aggregationResult.metadata.filterCounts.afterFiltering = filteredLogs.length;
      aggregationResult.metadata.totalLogs = filteredLogs.length;

      // Sorting
      filteredLogs = this.sortLogs(filteredLogs, sortBy, sortOrder);

      // Grouping
      if (groupBy && includeMetadata) {
        aggregationResult.metadata.groupedData = this.groupLogs(filteredLogs, groupBy);
      }

      // Pagination
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);

      const result = {
        success: true,
        logs: paginatedLogs,
        metadata: aggregationResult.metadata,
        pagination: {
          total: filteredLogs.length,
          limit,
          offset,
          hasMore: offset + limit < filteredLogs.length,
          nextOffset: offset + limit < filteredLogs.length ? offset + limit : null
        },
        config: aggregationResult.config
      };

      // Cache the result
      if (enableCache) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      console.log(`✅ Aggregation complete: ${result.logs.length} logs returned`);
      return result;

    } catch (error) {
      console.error('❌ Error in log aggregation:', error);
      return {
        success: false,
        error: error.message,
        config
      };
    }
  }

  // 🎯 Process single user's logs
  async processUserLogs(userId, options = {}) {
    try {
      const { date = null, aliasNames = [], logLevels = [] } = options;
      
      const userAliases = this.userAliasService.getUserAliases(userId);
      
      if (userAliases.length === 0) {
        return {
          success: false,
          error: `No aliases found for user ${userId}`,
          logs: [],
          filesCount: 0
        };
      }

      // Filter aliases if specified
      const targetAliases = aliasNames.length > 0 
        ? userAliases.filter(alias => aliasNames.includes(alias.aliasName))
        : userAliases;

      if (targetAliases.length === 0) {
        return {
          success: false,
          error: `No matching aliases found for user ${userId}`,
          logs: [],
          filesCount: 0
        };
      }

      const userLogs = [];
      let filesCount = 0;

      for (const alias of targetAliases) {
        const filesResult = await this.logService.findTodaysFiles(alias.basePath, date);
        
        if (filesResult.success && filesResult.files.length > 0) {
          for (const file of filesResult.files) {
            const contentResult = await this.logService.readFileContent(file.filePath);
            
            if (contentResult.success) {
              filesCount++;

              // Convert raw lines to structured log objects
              contentResult.content.forEach((line, index) => {
                const logEntry = {
                  id: `${userId}-${alias.aliasName}-${file.fileName}-${index}`,
                  userId,
                  userName: userId,
                  aliasName: alias.aliasName,
                  aliasPath: alias.basePath,
                  fileName: file.fileName,
                  filePath: file.filePath,
                  lineNumber: index + 1,
                  content: line,
                  rawContent: line,
                  timestamp: this.extractTimestamp(line),
                  logLevel: this.detectLogLevel(line),
                  fileModified: file.modified,
                  fileSize: file.size,
                  fileSizeFormatted: file.sizeFormatted,
                  source: `${userId}/${alias.aliasName}/${file.fileName}`,
                  metadata: {
                    extractedAt: new Date().toISOString(),
                    isError: this.isErrorLog(line),
                    isWarning: this.isWarningLog(line),
                    hasStackTrace: line.includes('at ') && line.includes('('),
                    lineLength: line.length
                  }
                };

                userLogs.push(logEntry);
              });
            }
          }
        }
      }

      return {
        success: true,
        logs: userLogs,
        filesCount,
        aliasesProcessed: targetAliases.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        logs: [],
        filesCount: 0
      };
    }
  }

  // 🎯 Sort logs by different criteria
  sortLogs(logs, sortBy, sortOrder = 'desc') {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    
    return logs.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp || a.fileModified) - new Date(b.timestamp || b.fileModified);
          break;
        case 'user':
          comparison = a.userId.localeCompare(b.userId);
          break;
        case 'alias':
          comparison = a.aliasName.localeCompare(b.aliasName);
          break;
        case 'level':
          const levelPriority = { ERROR: 4, WARNING: 3, INFO: 2, DEBUG: 1 };
          comparison = (levelPriority[a.logLevel] || 0) - (levelPriority[b.logLevel] || 0);
          break;
        case 'file':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        default:
          comparison = new Date(a.timestamp || a.fileModified) - new Date(b.timestamp || b.fileModified);
      }
      
      return comparison * multiplier;
    });
  }

  // 🎯 Group logs by different criteria
  groupLogs(logs, groupBy) {
    const grouped = {};
    
    logs.forEach(log => {
      let groupKey;
      
      switch (groupBy) {
        case 'user':
          groupKey = log.userId;
          break;
        case 'alias':
          groupKey = `${log.userId}/${log.aliasName}`;
          break;
        case 'level':
          groupKey = log.logLevel;
          break;
        case 'file':
          groupKey = log.fileName;
          break;
        case 'hour':
          const hour = new Date(log.timestamp || log.fileModified).getHours();
          groupKey = `${hour}:00`;
          break;
        case 'date':
          groupKey = new Date(log.timestamp || log.fileModified).toISOString().split('T')[0];
          break;
        default:
          groupKey = 'all';
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(log);
    });
    
    // Add counts to each group
    Object.keys(grouped).forEach(key => {
      grouped[key] = {
        logs: grouped[key],
        count: grouped[key].length,
        errors: grouped[key].filter(log => log.logLevel === 'ERROR').length,
        warnings: grouped[key].filter(log => log.logLevel === 'WARNING').length
      };
    });
    
    return grouped;
  }

  // 🎯 Get live log stream (for real-time monitoring)
  async getLiveLogStream(config = {}) {
    try {
      const {
        userIds = [],
        intervalMs = 5000,
        maxLogsPerUser = 50,
        sinceTimestamp = null
      } = config;

      const targetUsers = userIds.length > 0 ? userIds : this.userAliasService.getAllUsers();
      const cutoffTime = sinceTimestamp ? new Date(sinceTimestamp) : new Date(Date.now() - intervalMs);
      
      const liveData = {
        newLogs: [],
        userActivity: {},
        totalNewLogs: 0,
        streamTime: new Date().toISOString()
      };

      for (const userId of targetUsers) {
        const userResult = await this.processUserLogs(userId);
        
        if (userResult.success) {
          // Filter for recent logs
          const recentLogs = userResult.logs.filter(log => {
            const logTime = new Date(log.timestamp || log.fileModified);
            return logTime > cutoffTime;
          });

          // Limit logs per user
          const limitedLogs = recentLogs.slice(0, maxLogsPerUser);
          
          liveData.newLogs.push(...limitedLogs);
          liveData.userActivity[userId] = {
            newLogsCount: limitedLogs.length,
            totalLogsAvailable: userResult.logs.length,
            lastActivity: limitedLogs[0]?.timestamp || null
          };
        }
      }

      // Sort by timestamp (newest first)
      liveData.newLogs.sort((a, b) => 
        new Date(b.timestamp || b.fileModified) - new Date(a.timestamp || a.fileModified)
      );

      liveData.totalNewLogs = liveData.newLogs.length;

      return {
        success: true,
        liveData,
        hasNewActivity: liveData.totalNewLogs > 0
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Generate cache key for results
  generateCacheKey(config) {
    const keyParts = [
      config.userIds?.sort().join(',') || 'all',
      config.aliasNames?.sort().join(',') || 'all',
      config.date || 'current',
      config.logLevels?.sort().join(',') || 'all',
      config.limit || 1000,
      config.offset || 0
    ];
    return keyParts.join('|');
  }

  // 🎯 Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  // Helper methods
  extractTimestamp(line) {
    const patterns = [
      /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/,
      /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
      /^\[(\d{2}:\d{2}:\d{2})\]/,
      /^(\d{2}:\d{2}:\d{2})/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }

    return new Date().toISOString();
  }

  detectLogLevel(line) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('failed') || lowerLine.includes('exception')) return 'ERROR';
    if (lowerLine.includes('warn') || lowerLine.includes('warning')) return 'WARNING';
    if (lowerLine.includes('info') || lowerLine.includes('success')) return 'INFO';
    return 'DEBUG';
  }

  isErrorLog(line) {
    return this.detectLogLevel(line) === 'ERROR';
  }

  isWarningLog(line) {
    return this.detectLogLevel(line) === 'WARNING';
  }
}