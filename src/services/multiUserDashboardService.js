// 📁 src/services/multiUserDashboardService.js
// UPDATED - With File IDs (UserId-AliasName-FileName)
// ==========================================
import { UserAliasService } from './userAliasService.js';
import { SimpleLogService } from './simpleLogService.js';

export class MultiUserDashboardService {
  constructor() {
    this.userAliasService = new UserAliasService();
    this.logService = new SimpleLogService();
  }

  // 🎯 Get ALL users logs - WITH FILE IDs
  async getAllUsersLogsSimple(options = {}) {
    try {
      const { date = null } = options;
      
      // Get ALL users in system
      const allUsers = this.userAliasService.getAllUsers();
      console.log(`🌐 Processing ALL users: [${allUsers.join(', ')}]`);
      
      if (allUsers.length === 0) {
        return {
          success: false,
          error: 'No users found in system',
          suggestion: 'Create some user aliases first'
        };
      }

      // Process each user
      const allUserData = [];
      let totalLogs = 0;

      for (const userId of allUsers) {
        console.log(`👤 Processing user: ${userId}`);
        
        const userData = await this.getUserFilesWithContent(userId, { date });
        allUserData.push(userData);
        
        if (userData.success) {
          totalLogs += userData.totalLogs;
        }
      }

      const searchDate = date || new Date().toISOString().split('T')[0];

      return {
        success: true,
        data: {
          users: allUserData,
          totalUsers: allUsers.length,
          totalLogs: totalLogs,
          searchDate: searchDate,
          isCurrentDate: !date,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error getting all users logs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Get SPECIFIC users logs - WITH FILE IDs
  async getSpecificUsersLogsSimple(userIds = [], options = {}) {
    try {
      const { date = null } = options;
      
      console.log(`📊 Processing specific users: [${userIds.join(', ')}]`);
      
      if (userIds.length === 0) {
        // If no users specified, get ALL users
        return await this.getAllUsersLogsSimple(options);
      }

      // Process each specified user
      const userData = [];
      let totalLogs = 0;

      for (const userId of userIds) {
        console.log(`👤 Processing user: ${userId}`);
        
        const userResult = await this.getUserFilesWithContent(userId, { date });
        userData.push(userResult);
        
        if (userResult.success) {
          totalLogs += userResult.totalLogs;
        }
      }

      const searchDate = date || new Date().toISOString().split('T')[0];

      return {
        success: true,
        data: {
          users: userData,
          totalUsers: userIds.length,
          totalLogs: totalLogs,
          searchDate: searchDate,
          isCurrentDate: !date,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error getting specific users logs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 Get user's files with content - WITH UNIQUE FILE IDs
  async getUserFilesWithContent(userId, options = {}) {
    try {
      const { date = null } = options;
      
      const aliases = this.userAliasService.getUserAliases(userId);
      
      if (aliases.length === 0) {
        return {
          userId,
          success: false,
          error: `No aliases found for user ${userId}`,
          aliases: [],
          totalLogs: 0
        };
      }

      const aliasResults = [];
      let userTotalLogs = 0;

      // Process each alias for this user
      for (const alias of aliases) {
        console.log(`  📂 Processing alias: ${alias.aliasName}`);
        
        // Find today's files (or specific date)
        const filesResult = await this.logService.findTodaysFiles(alias.basePath, date);
        
        if (!filesResult.success) {
          aliasResults.push({
            aliasName: alias.aliasName,
            basePath: alias.basePath,
            success: false,
            error: filesResult.error,
            files: [],
            totalLogs: 0
          });
          continue;
        }

        if (filesResult.files.length === 0) {
          aliasResults.push({
            aliasName: alias.aliasName,
            basePath: alias.basePath,
            success: false,
            error: `No log files found for date ${filesResult.searchDate}`,
            files: [],
            totalLogs: 0
          });
          continue;
        }

        // Read content from each file - WITH UNIQUE IDs
        const filesWithContent = [];
        let aliasLogCount = 0;

        for (const file of filesResult.files) {
          console.log(`📖 Processing file: ${file.fileName}`);
          
          const contentResult = await this.logService.readFileContent(file.filePath);
          
          // 🎯 CREATE UNIQUE FILE ID: UserId-AliasName-FileName
          const fileId = `${userId}-${alias.aliasName}-${file.fileName}`;
          
          const fileData = {
            id: fileId,  // ✅ UNIQUE ID ADDED
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
            readAt: contentResult.readAt,
            
            // ✅ METADATA FOR UI
            metadata: {
              userId: userId,
              aliasName: alias.aliasName,
              uniqueId: fileId,
              source: `${userId}/${alias.aliasName}/${file.fileName}`
            }
          };

          if (contentResult.success) {
            aliasLogCount += contentResult.totalLines;
            console.log(`  ✅ Success: ${file.fileName} - ${contentResult.totalLines} lines (ID: ${fileId})`);
          } else {
            console.log(`  ❌ Failed: ${file.fileName} - ${contentResult.error}`);
          }

          filesWithContent.push(fileData);
        }

        // Update alias access count
        await this.userAliasService.updateAliasAccess(userId, alias.aliasName);

        aliasResults.push({
          aliasName: alias.aliasName,
          basePath: alias.basePath,
          accessCount: alias.accessCount + 1,
          lastAccessed: new Date().toISOString(),
          success: true,
          files: filesWithContent,
          summary: {
            totalFiles: filesWithContent.length,
            successfulFiles: filesWithContent.filter(f => f.success).length,
            failedFiles: filesWithContent.filter(f => !f.success).length,
            totalLogs: aliasLogCount
          },
          // ✅ FILE IDs LIST FOR QUICK REFERENCE
          fileIds: filesWithContent.map(f => f.id)
        });

        userTotalLogs += aliasLogCount;
      }

      const searchDate = date || new Date().toISOString().split('T')[0];

      return {
        userId,
        success: true,
        searchDate: searchDate,
        isCurrentDate: !date,
        aliases: aliasResults,
        summary: {
          totalAliases: aliases.length,
          totalLogs: userTotalLogs,
          totalFiles: aliasResults.reduce((sum, alias) => sum + (alias.summary?.totalFiles || 0), 0)
        },
        // ✅ ALL FILE IDs FOR THIS USER
        allFileIds: aliasResults.flatMap(alias => alias.fileIds || []),
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error getting user files for ${userId}:`, error);
      return {
        userId,
        success: false,
        error: error.message,
        aliases: [],
        totalLogs: 0,
        allFileIds: []
      };
    }
  }
}