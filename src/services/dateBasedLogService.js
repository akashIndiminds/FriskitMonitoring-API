// src/services/dateBasedLogService.js - Date Modified File Service
// ==========================================
import fs from 'fs-extra';
import path from 'path';
import { parseLogTimestamp, formatDate } from '../utils/dateUtils.js';

export class DateBasedLogService {
  constructor() {
    this.supportedExtensions = ['.log', '.txt', '.out', '.err', '.json'];
  }

  // Get logs by date (using file modified date)
  async getLogsByDate(directoryPath, targetDate = null, options = {}) {
    try {
      const { limit = 100, offset = 0, level, userInfo = 'developer' } = options;
      
      // Use current date if no date provided
      const searchDate = targetDate ? new Date(targetDate) : new Date();
      const dateStr = searchDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log(`Searching for files modified on: ${dateStr}`);
      
      // Normalize network path
      const normalizedPath = this.normalizeNetworkPath(directoryPath);
      
      if (!await fs.pathExists(normalizedPath)) {
        return {
          success: false,
          error: 'Directory not found',
          path: normalizedPath,
          originalPath: directoryPath
        };
      }

      // Get files filtered by modified date
      const matchingFiles = await this.getFilesByModifiedDate(normalizedPath, searchDate);
      
      if (matchingFiles.length === 0) {
        return {
          success: false,
          error: `No files found for date ${dateStr}`,
          path: normalizedPath,
          searchDate: dateStr,
          suggestion: 'Try different date or check available dates in directory'
        };
      }

      // Get the most recent file for the date (in case multiple files)
      const targetFile = matchingFiles[0]; // Already sorted by modified time
      const fullPath = path.join(normalizedPath, targetFile.name);

      console.log(`Selected file: ${targetFile.name} (Modified: ${targetFile.modified})`);

      const content = await fs.readFile(fullPath, 'utf-8');
      const allLogs = this.parseLogContent(content, targetFile.name);
      
      let filteredLogs = level ? 
        allLogs.filter(log => log.level === level) : 
        allLogs;

      const paginatedLogs = filteredLogs.slice(offset, offset + limit);
      const stats = await fs.stat(fullPath);

      return {
        success: true,
        searchDate: dateStr,
        file: targetFile.name,
        originalPath: directoryPath,
        normalizedPath,
        fullPath,
        logs: paginatedLogs,
        fileInfo: {
          name: targetFile.name,
          size: targetFile.size,
          sizeFormatted: this.formatBytes(targetFile.size),
          modified: targetFile.modified,
          created: targetFile.created,
          extension: targetFile.extension
        },
        matchingFiles: matchingFiles.map(f => ({
          name: f.name,
          modified: f.modified,
          size: this.formatBytes(f.size)
        })),
        summary: {
          totalLines: allLogs.length,
          filteredLines: filteredLogs.length,
          displayedLines: paginatedLogs.length,
          filesFoundForDate: matchingFiles.length
        },
        pagination: {
          offset,
          limit,
          total: filteredLogs.length,
          hasMore: offset + limit < filteredLogs.length
        },
        statistics: this.calculateLogStatistics(allLogs)
      };

    } catch (error) {
      console.error('Error getting logs by date:', error);
      return {
        success: false,
        error: error.message,
        path: directoryPath,
        troubleshooting: [
          'Check if network path is accessible',
          'Verify directory permissions',
          'Ensure date format is YYYY-MM-DD'
        ]
      };
    }
  }

  // Get available dates in directory (based on file modified dates)
  async getAvailableDates(directoryPath) {
    try {
      const normalizedPath = this.normalizeNetworkPath(directoryPath);
      
      if (!await fs.pathExists(normalizedPath)) {
        return {
          success: false,
          error: 'Directory not found',
          path: normalizedPath
        };
      }

      const items = await fs.readdir(normalizedPath, { withFileTypes: true });
      const dateMap = new Map();

      for (const item of items) {
        if (item.isFile()) {
          const filePath = path.join(normalizedPath, item.name);
          const ext = path.extname(item.name).toLowerCase();
          
          // Only process supported file types
          if (this.supportedExtensions.includes(ext)) {
            try {
              const stats = await fs.stat(filePath);
              const modifiedDate = stats.mtime.toISOString().split('T')[0]; // YYYY-MM-DD
              
              if (!dateMap.has(modifiedDate)) {
                dateMap.set(modifiedDate, []);
              }
              
              dateMap.get(modifiedDate).push({
                name: item.name,
                size: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                modified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString(),
                extension: ext
              });
            } catch (statError) {
              console.warn(`Error getting stats for ${item.name}:`, statError.message);
            }
          }
        }
      }

      // Sort dates (newest first) and sort files within each date
      const availableDates = Array.from(dateMap.entries())
        .map(([date, files]) => ({
          date,
          fileCount: files.length,
          files: files.sort((a, b) => new Date(b.modified) - new Date(a.modified)),
          totalSize: files.reduce((sum, f) => sum + f.size, 0),
          totalSizeFormatted: this.formatBytes(files.reduce((sum, f) => sum + f.size, 0))
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        success: true,
        path: normalizedPath,
        availableDates,
        summary: {
          totalDates: availableDates.length,
          totalFiles: availableDates.reduce((sum, d) => sum + d.fileCount, 0),
          dateRange: {
            newest: availableDates[0]?.date,
            oldest: availableDates[availableDates.length - 1]?.date
          }
        }
      };

    } catch (error) {
      console.error('Error getting available dates:', error);
      return {
        success: false,
        error: error.message,
        path: directoryPath
      };
    }
  }

  // Get files modified on specific date
  async getFilesByModifiedDate(directoryPath, targetDate) {
    const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const items = await fs.readdir(directoryPath, { withFileTypes: true });
    const matchingFiles = [];

    for (const item of items) {
      if (item.isFile()) {
        const filePath = path.join(directoryPath, item.name);
        const ext = path.extname(item.name).toLowerCase();
        
        // Only process supported file types
        if (this.supportedExtensions.includes(ext)) {
          try {
            const stats = await fs.stat(filePath);
            const fileModifiedDate = stats.mtime.toISOString().split('T')[0];
            
            if (fileModifiedDate === targetDateStr) {
              matchingFiles.push({
                name: item.name,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString(),
                extension: ext,
                modifiedTime: stats.mtime
              });
            }
          } catch (statError) {
            console.warn(`Error getting stats for ${item.name}:`, statError.message);
          }
        }
      }
    }

    // Sort by modified time (newest first)
    return matchingFiles.sort((a, b) => b.modifiedTime - a.modifiedTime);
  }

  // Get date range logs (multiple dates)
  async getLogsByDateRange(directoryPath, startDate, endDate, options = {}) {
    try {
      const { limit = 500, level } = options;
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        };
      }

      const normalizedPath = this.normalizeNetworkPath(directoryPath);
      const allLogs = [];
      const processedFiles = [];
      const current = new Date(start);

      while (current <= end) {
        const dayResult = await this.getLogsByDate(directoryPath, current.toISOString().split('T')[0]);
        
        if (dayResult.success) {
          allLogs.push(...dayResult.logs);
          processedFiles.push({
            date: current.toISOString().split('T')[0],
            file: dayResult.file,
            logCount: dayResult.logs.length
          });
        }
        
        current.setDate(current.getDate() + 1);
      }

      // Apply level filter if specified
      let filteredLogs = level ? 
        allLogs.filter(log => log.level === level) : 
        allLogs;

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply limit
      const limitedLogs = limit > 0 ? filteredLogs.slice(0, limit) : filteredLogs;

      return {
        success: true,
        dateRange: { startDate, endDate },
        logs: limitedLogs,
        processedFiles,
        summary: {
          totalFiles: processedFiles.length,
          totalLogs: allLogs.length,
          filteredLogs: filteredLogs.length,
          displayedLogs: limitedLogs.length
        },
        statistics: this.calculateLogStatistics(allLogs)
      };

    } catch (error) {
      console.error('Error getting logs by date range:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Normalize network paths for Windows
  normalizeNetworkPath(filePath) {
    if (filePath.startsWith('\\\\')) {
      return filePath;
    }
    if (filePath.startsWith('\\')) {
      return '\\' + filePath;
    }
    return filePath;
  }

  // Parse log content (same as before)
  parseLogContent(content, fileName) {
    const lines = content.split('\n').filter(line => line.trim());
    const logs = [];

    for (let i = 0; i < lines.length; i++) {
      const parsedLog = this.parseLogLine(lines[i], i + 1, fileName);
      if (parsedLog) {
        logs.push(parsedLog);
      }
    }

    return logs.reverse(); // Show newest first
  }

  parseLogLine(line, lineNumber, fileName) {
    const timestamp = parseLogTimestamp(line);
    let message = line.trim();

    const timestampPatterns = [
      /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/,
      /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
      /^\[(\d{2}:\d{2}:\d{2})\]/,
      /^(\d{2}:\d{2}:\d{2})/
    ];

    for (const pattern of timestampPatterns) {
      const match = line.match(pattern);
      if (match) {
        message = line.substring(match[0].length).trim();
        break;
      }
    }

    const level = this.detectLogLevel(message);

    return {
      id: `${fileName}-${lineNumber}`,
      lineNumber,
      timestamp,
      message,
      level,
      raw: line,
      fileName,
      isError: ['ERROR', 'CRITICAL'].includes(level),
      isWarning: level === 'WARNING',
      color: this.getLogColor(level),
      severity: this.getLogSeverity(level)
    };
  }

  detectLogLevel(message) {
    const lowerMessage = message.toLowerCase();
    
    const patterns = {
      CRITICAL: ['fatal', 'critical', 'crash', 'abort', 'emergency', 'panic'],
      ERROR: ['error', 'failed', 'failure', 'exception', 'traceback', 'stderr'],
      WARNING: ['warning', 'warn', 'deprecated', 'timeout', 'retry'],
      INFO: ['info', 'starting', 'started', 'success', 'completed', 'finished']
    };

    for (const [level, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return level;
      }
    }

    return 'DEBUG';
  }

  calculateLogStatistics(logs) {
    const stats = {
      total: logs.length,
      byLevel: {},
      timeRange: {},
      topErrors: [],
      recentActivity: []
    };

    logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    stats.recentActivity = logs.filter(log => 
      new Date(log.timestamp) > oneHourAgo
    ).length;

    const timestamps = logs
      .map(log => log.timestamp)
      .filter(ts => !isNaN(Date.parse(ts)))
      .sort();

    if (timestamps.length > 0) {
      stats.timeRange = {
        earliest: timestamps[0],
        latest: timestamps[timestamps.length - 1]
      };
    }

    const errorMessages = {};
    logs.filter(log => log.isError || log.isWarning).forEach(log => {
      const shortMsg = log.message.substring(0, 100);
      errorMessages[shortMsg] = (errorMessages[shortMsg] || 0) + 1;
    });

    stats.topErrors = Object.entries(errorMessages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([msg, count]) => ({ message: msg, count }));

    return stats;
  }

  getLogColor(level) {
    const colors = {
      CRITICAL: '#ff0000',
      ERROR: '#ff6b6b', 
      WARNING: '#ffa500',
      INFO: '#4dabf7',
      DEBUG: '#868e96'
    };
    return colors[level] || '#212529';
  }

  getLogSeverity(level) {
    const severities = {
      CRITICAL: 5,
      ERROR: 4,
      WARNING: 3,
      INFO: 2,
      DEBUG: 1
    };
    return severities[level] || 0;
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}