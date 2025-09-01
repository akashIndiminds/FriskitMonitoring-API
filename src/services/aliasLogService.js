// 📁 UPDATED: src/services/aliasLogService.js 
// Enhanced with better current date handling
// ==========================================
import { UserAliasService } from './userAliasService.js';
import { SimpleLogService } from './simpleLogService.js';

export class AliasLogService {
  constructor() {
    this.userAliasService = new UserAliasService();
    this.logService = new SimpleLogService();
  }

  // Get logs by user alias (default: current date)
  async getLogsByAlias(userId, aliasName, options = {}) {
    try {
      const { date = null } = options; // null = current date

      console.log(`🎯 Getting logs for user: ${userId}, alias: ${aliasName}`);
      console.log(`📅 Target date: ${date || 'current date'}`);

      // 1. Get alias info
      const alias = this.userAliasService.getUserAlias(userId, aliasName);
      if (!alias) {
        const availableAliases = this.userAliasService.getUserAliases(userId);
        return {
          success: false,
          error: `Alias "${aliasName}" not found for user ${userId}`,
          availableAliases: availableAliases.map(a => ({
            name: a.aliasName,
            basePath: a.basePath,
            accessCount: a.accessCount
          }))
        };
      }

      // 2. Find today's files in the path (or specific date)
      const filesResult = await this.logService.findTodaysFiles(alias.basePath, date);
      if (!filesResult.success) {
        return {
          success: false,
          error: filesResult.error,
          alias: {
            name: alias.aliasName,
            basePath: alias.basePath
          },
          searchDate: filesResult.searchDate,
          isCurrentDate: filesResult.isCurrentDate
        };
      }

      if (filesResult.files.length === 0) {
        const currentDate = new Date().toISOString().split('T')[0];
        const isSearchingToday = filesResult.searchDate === currentDate;
        
        return {
          success: false,
          error: isSearchingToday ? 
            `No log files found for today (${filesResult.searchDate})` :
            `No log files found for date ${filesResult.searchDate}`,
          alias: {
            name: alias.aliasName,
            basePath: alias.basePath
          },
          searchDate: filesResult.searchDate,
          isCurrentDate: isSearchingToday,
          suggestion: isSearchingToday ? 
            'Check if logs are being generated today or try a different date' :
            'Try current date or check if logs exist for this date'
        };
      }

      // 3. Read content from each file
      const filesWithContent = [];
      let totalLogsCount = 0;

      for (const file of filesResult.files) {
        console.log(`📖 Processing file: ${file.fileName}`);
        
        const contentResult = await this.logService.readFileContent(file.filePath);
        
        const fileData = {
          fileName: file.fileName,
          filePath: file.filePath,
          size: file.size,
          sizeFormatted: file.sizeFormatted,
          modified: file.modified,
          modifiedDate: file.modifiedDate,
          extension: file.extension,
          success: contentResult.success,
          totalLines: contentResult.totalLines || 0,
          logs: contentResult.content || [], // Raw lines array
          error: contentResult.error,
          readAt: contentResult.readAt
        };

        if (contentResult.success) {
          totalLogsCount += contentResult.totalLines;
          console.log(`  ✅ Success: ${contentResult.totalLines} lines read`);
        } else {
          console.log(`  ❌ Failed: ${contentResult.error}`);
        }

        filesWithContent.push(fileData);
      }

      // 4. Update alias access
      await this.userAliasService.updateAliasAccess(userId, aliasName);

      const result = {
        success: true,
        alias: {
          name: alias.aliasName,
          basePath: alias.basePath,
          accessCount: alias.accessCount + 1,
          lastAccessed: new Date().toISOString()
        },
        searchDate: filesResult.searchDate,
        isCurrentDate: filesResult.isCurrentDate,
        files: filesWithContent,
        summary: {
          totalFiles: filesWithContent.length,
          successfulFiles: filesWithContent.filter(f => f.success).length,
          failedFiles: filesWithContent.filter(f => !f.success).length,
          totalLogs: totalLogsCount,
          searchType: filesResult.isCurrentDate ? 'current_date' : 'specific_date'
        },
        generatedAt: new Date().toISOString()
      };

      console.log(`✅ Complete: ${result.summary.totalFiles} files, ${result.summary.totalLogs} total logs`);
      
      return result;

    } catch (error) {
      console.error('❌ Error getting logs by alias:', error);
      return {
        success: false,
        error: error.message,
        userId,
        aliasName
      };
    }
  }

  // Get logs for all user aliases (current date)
  async getAllUserLogs(userId, options = {}) {
    try {
      const { date = null } = options; // null = current date
      
      console.log(`🌐 Getting all logs for user: ${userId}`);
      console.log(`📅 Target date: ${date || 'current date'}`);
      
      const aliases = this.userAliasService.getUserAliases(userId);
      
      if (aliases.length === 0) {
        return {
          success: false,
          error: `No aliases found for user ${userId}`,
          suggestion: 'Create aliases first using POST /api/alias-logs/alias',
          userId
        };
      }

      const results = [];
      let totalFiles = 0;
      let totalLogs = 0;

      for (const alias of aliases) {
        console.log(`  📂 Processing alias: ${alias.aliasName}`);
        
        const result = await this.getLogsByAlias(userId, alias.aliasName, { date });
        
        results.push({
          aliasName: alias.aliasName,
          basePath: alias.basePath,
          ...result
        });

        if (result.success) {
          totalFiles += result.summary.totalFiles;
          totalLogs += result.summary.totalLogs;
        }
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const searchDate = date || currentDate;

      return {
        success: true,
        userId,
        searchDate,
        isCurrentDate: !date,
        totalAliases: aliases.length,
        aliases: results,
        overallSummary: {
          totalAliases: results.length,
          successfulAliases: results.filter(r => r.success).length,
          failedAliases: results.filter(r => !r.success).length,
          totalFiles,
          totalLogs,
          searchType: !date ? 'current_date' : 'specific_date'
        },
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting all user logs:', error);
      return {
        success: false,
        error: error.message,
        userId
      };
    }
  }
}