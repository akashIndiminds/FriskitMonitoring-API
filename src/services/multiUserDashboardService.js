// 📁 src/services/multiUserDashboardService.js
// Multi-User Dashboard - Aggregate logs from multiple users
// ==========================================
import { UserAliasService } from './userAliasService.js';
import { SimpleLogService } from './simpleLogService.js';

export class MultiUserDashboardService {
  constructor() {
    this.userAliasService = new UserAliasService();
    this.logService = new SimpleLogService();
  }

  // 🎯 Get logs from multiple users for dashboard
  async getDashboardLogs(userIds = [], options = {}) {
    try {
      const { date = null, includeStats = true, groupBy = 'user' } = options;
      
      console.log(`🌐 Dashboard request for users: [${userIds.join(', ')}]`);
      console.log(`📅 Target date: ${date || 'current date'}`);
      
      // If no users specified, get ALL users
      if (userIds.length === 0) {
        userIds = this.userAliasService.getAllUsers();
        console.log(`📋 No users specified, using ALL users: [${userIds.join(', ')}]`);
      }

      if (userIds.length === 0) {
        return {
          success: false,
          error: 'No users found in system',
          suggestion: 'Create some user aliases first'
        };
      }

      const dashboardData = {
        users: [],
        aggregatedLogs: [],
        statistics: {
          totalUsers: userIds.length,
          totalAliases: 0,
          totalFiles: 0,
          totalLogs: 0,
          successfulUsers: 0,
          failedUsers: 0,
          userBreakdown: {}
        }
      };

      // Process each user
      for (const userId of userIds) {
        console.log(`👤 Processing user: ${userId}`);
        
        const userData = await this.getUserLogsForDashboard(userId, { date });
        dashboardData.users.push(userData);

        // Aggregate statistics
        if (userData.success) {
          dashboardData.statistics.successfulUsers++;
          dashboardData.statistics.totalAliases += userData.summary.totalAliases;
          dashboardData.statistics.totalFiles += userData.summary.totalFiles;
          dashboardData.statistics.totalLogs += userData.summary.totalLogs;

          // Add to aggregated logs with user context
          userData.logs.forEach(log => {
            dashboardData.aggregatedLogs.push({
              ...log,
              userId: userData.userId,
              userName: userData.userName || userData.userId,
              source: `${userData.userId}/${log.aliasName}/${log.fileName}`
            });
          });
        } else {
          dashboardData.statistics.failedUsers++;
        }

        // User breakdown
        dashboardData.statistics.userBreakdown[userId] = {
          success: userData.success,
          aliases: userData.success ? userData.summary.totalAliases : 0,
          files: userData.success ? userData.summary.totalFiles : 0,
          logs: userData.success ? userData.summary.totalLogs : 0,
          error: userData.success ? null : userData.error
        };
      }

      // Sort aggregated logs by timestamp (newest first)
      dashboardData.aggregatedLogs.sort((a, b) => 
        new Date(b.timestamp || b.modified) - new Date(a.timestamp || a.modified)
      );

      const result = {
        success: true,
        searchDate: date || new Date().toISOString().split('T')[0],
        isCurrentDate: !date,
        dashboard: dashboardData,
        generatedAt: new Date().toISOString()
      };

      console.log(`✅ Dashboard complete: ${dashboardData.statistics.totalLogs} total logs from ${dashboardData.statistics.successfulUsers} users`);
      
      return result;

    } catch (error) {
      console.error('❌ Error generating dashboard:', error);
      return {
        success: false,
        error: error.message,
        userIds
      };
    }
  }

  // 🎯 Get single user's logs formatted for dashboard
  async getUserLogsForDashboard(userId, options = {}) {
    try {
      const { date = null } = options;
      
      const aliases = this.userAliasService.getUserAliases(userId);
      
      if (aliases.length === 0) {
        return {
          userId,
          userName: userId,
          success: false,
          error: `No aliases found for user ${userId}`,
          aliases: [],
          logs: [],
          summary: {
            totalAliases: 0,
            totalFiles: 0,
            totalLogs: 0
          }
        };
      }

      const userLogs = [];
      let totalFiles = 0;
      let totalLogs = 0;
      const aliasResults = [];

      // Process each alias for this user
      for (const alias of aliases) {
        console.log(`  📂 Processing alias: ${alias.aliasName}`);
        
        const filesResult = await this.logService.findTodaysFiles(alias.basePath, date);
        
        if (filesResult.success && filesResult.files.length > 0) {
          // Read content from each file
          for (const file of filesResult.files) {
            const contentResult = await this.logService.readFileContent(file.filePath);
            
            if (contentResult.success) {
              totalFiles++;
              totalLogs += contentResult.totalLines;

              // Convert raw lines to log objects for dashboard
              contentResult.content.forEach((line, index) => {
                userLogs.push({
                  id: `${userId}-${alias.aliasName}-${file.fileName}-${index}`,
                  userId,
                  aliasName: alias.aliasName,
                  fileName: file.fileName,
                  filePath: file.filePath,
                  lineNumber: index + 1,
                  content: line,
                  timestamp: this.extractTimestamp(line),
                  logLevel: this.detectLogLevel(line),
                  modified: file.modified,
                  fileSize: file.size
                });
              });
            }
          }
        }

        aliasResults.push({
          aliasName: alias.aliasName,
          basePath: alias.basePath,
          filesFound: filesResult.success ? filesResult.files.length : 0,
          success: filesResult.success,
          error: filesResult.success ? null : filesResult.error
        });
      }

      return {
        userId,
        userName: userId,
        success: true,
        aliases: aliasResults,
        logs: userLogs,
        summary: {
          totalAliases: aliases.length,
          totalFiles,
          totalLogs
        }
      };

    } catch (error) {
      console.error(`❌ Error getting user logs for ${userId}:`, error);
      return {
        userId,
        userName: userId,
        success: false,
        error: error.message,
        aliases: [],
        logs: [],
        summary: {
          totalAliases: 0,
          totalFiles: 0,
          totalLogs: 0
        }
      };
    }
  }

  // 🎯 Get real-time dashboard updates (polling)
  async getDashboardUpdates(userIds = [], lastUpdateTime = null, options = {}) {
    try {
      const { maxLogs = 100 } = options;
      
      console.log(`🔄 Dashboard updates requested for: [${userIds.join(', ')}]`);
      console.log(`⏰ Since: ${lastUpdateTime || 'beginning'}`);
      
      const cutoffTime = lastUpdateTime ? new Date(lastUpdateTime) : new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
      
      const updates = {
        newLogs: [],
        userUpdates: [],
        totalNewLogs: 0,
        updateTime: new Date().toISOString()
      };

      for (const userId of userIds) {
        const userLogs = await this.getUserLogsForDashboard(userId);
        
        if (userLogs.success) {
          // Filter logs newer than cutoff time
          const newLogs = userLogs.logs.filter(log => {
            const logTime = new Date(log.timestamp || log.modified);
            return logTime > cutoffTime;
          });

          updates.newLogs.push(...newLogs);
          updates.userUpdates.push({
            userId,
            newLogsCount: newLogs.length,
            totalLogs: userLogs.logs.length
          });
        }
      }

      // Sort by timestamp and limit
      updates.newLogs.sort((a, b) => 
        new Date(b.timestamp || b.modified) - new Date(a.timestamp || a.modified)
      );
      
      if (updates.newLogs.length > maxLogs) {
        updates.newLogs = updates.newLogs.slice(0, maxLogs);
      }

      updates.totalNewLogs = updates.newLogs.length;

      return {
        success: true,
        updates,
        hasNewData: updates.totalNewLogs > 0
      };

    } catch (error) {
      console.error('❌ Error getting dashboard updates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Search across multiple users
  async searchAcrossUsers(userIds = [], searchQuery = '', options = {}) {
    try {
      const { date = null, caseSensitive = false, maxResults = 200 } = options;
      
      console.log(`🔍 Cross-user search: "${searchQuery}" in [${userIds.join(', ')}]`);
      
      const searchResults = {
        query: searchQuery,
        users: userIds,
        results: [],
        totalMatches: 0,
        searchTime: new Date().toISOString()
      };

      const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();

      for (const userId of userIds) {
        const userLogs = await this.getUserLogsForDashboard(userId, { date });
        
        if (userLogs.success) {
          const matches = userLogs.logs.filter(log => {
            const content = caseSensitive ? log.content : log.content.toLowerCase();
            return content.includes(query);
          });

          searchResults.results.push(...matches);
        }
      }

      // Sort by relevance and timestamp
      searchResults.results.sort((a, b) => {
        const aRelevance = (a.content.match(new RegExp(query, 'gi')) || []).length;
        const bRelevance = (b.content.match(new RegExp(query, 'gi')) || []).length;
        
        if (aRelevance !== bRelevance) return bRelevance - aRelevance;
        return new Date(b.timestamp || b.modified) - new Date(a.timestamp || a.modified);
      });

      if (searchResults.results.length > maxResults) {
        searchResults.results = searchResults.results.slice(0, maxResults);
      }

      searchResults.totalMatches = searchResults.results.length;

      return {
        success: true,
        searchResults
      };

    } catch (error) {
      console.error('❌ Error searching across users:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Get user statistics for dashboard
  async getUserStatistics(userIds = []) {
    try {
      const stats = {
        users: [],
        overview: {
          totalUsers: userIds.length,
          totalAliases: 0,
          activeUsers: 0,
          inactiveUsers: 0
        },
        generatedAt: new Date().toISOString()
      };

      for (const userId of userIds) {
        const aliases = this.userAliasService.getUserAliases(userId);
        const isActive = aliases.length > 0;
        
        if (isActive) stats.overview.activeUsers++;
        else stats.overview.inactiveUsers++;
        
        stats.overview.totalAliases += aliases.length;

        stats.users.push({
          userId,
          aliasCount: aliases.length,
          aliases: aliases.map(a => ({
            name: a.aliasName,
            basePath: a.basePath,
            accessCount: a.accessCount,
            lastAccessed: a.lastAccessed
          })),
          isActive,
          totalAccess: aliases.reduce((sum, a) => sum + a.accessCount, 0)
        });
      }

      return {
        success: true,
        statistics: stats
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods
  extractTimestamp(line) {
    const timestampPatterns = [
      /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/,
      /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
      /^\[(\d{2}:\d{2}:\d{2})\]/,
      /^(\d{2}:\d{2}:\d{2})/
    ];

    for (const pattern of timestampPatterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }

    return new Date().toISOString();
  }

  detectLogLevel(line) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('failed')) return 'ERROR';
    if (lowerLine.includes('warn') || lowerLine.includes('warning')) return 'WARNING';
    if (lowerLine.includes('info') || lowerLine.includes('success')) return 'INFO';
    return 'DEBUG';
  }
}